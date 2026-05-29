import { copyFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { ssim } from "ssim.js";
import { loadTargets } from "../core/targets.js";
import {
  buildCaptureGateMessage,
  buildInteractiveVerificationMessage,
  shouldInterruptEvaluation,
  shouldOfferInteractiveRepair,
  shouldUseScreenshotFallback,
} from "../core/captureGate.js";
import {
  normalizeTargetStates,
  validateStateCapture,
  validateTargetStateCaptures,
} from "../core/stateValidation.js";
import { writeJsonFile } from "../core/files.js";
import type {
  BrowserActionStep,
  CaptureMetrics,
  CaptureSide,
  DomProfile,
  PageStateConfig,
  PageTarget,
  PageEvaluationResult,
  SelectorCapture,
  StateCapture,
} from "../core/types.js";

const latestDir = join(process.cwd(), "reports", "latest");
const baselineDir = join(process.cwd(), "reports", "baselines");
const interactiveMode = process.env.EVAL_INTERACTIVE === "1";
const interactiveProfileDir =
  process.env.EVAL_PROFILE_DIR ?? join(process.cwd(), ".evaluator-browser-profile");

interface PageSession {
  page: Page;
  close: () => Promise<void>;
}

interface CaptureEvidenceOptions {
  target: PageTarget;
  state: PageStateConfig;
  side: CaptureSide;
  page: Page;
  url: string;
  viewport: { name: string; width: number; height: number };
  criticalSelectors: string[];
  compareSelectors: string[];
  status: number | null;
  start: number;
  suffix?: "failure";
  error?: string;
  manualVerified?: boolean;
}

function summarizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const firstLine = message.split("\n").find((line) => line.trim().length > 0) ?? message;
  const permissionLine = message
    .split("\n")
    .find((line) => /permission denied|eacces|eperm/i.test(line));

  return permissionLine ? `${firstLine}；${permissionLine.trim()}` : firstLine;
}

async function isBlankScreenshot(path: string): Promise<boolean> {
  const stats = await sharp(path).stats();
  const deviation = stats.channels.reduce((total, channel) => total + channel.stdev, 0);
  return deviation < 1;
}

async function collectSelectors(
  page: Page,
  selectors: string[],
): Promise<Record<string, SelectorCapture>> {
  const entries = await Promise.all(
    selectors.map(async (selector) => {
      const locator = page.locator(selector);
      const count = await locator.count();
      let visibleCount = 0;

      for (let index = 0; index < count; index += 1) {
        if (await locator.nth(index).isVisible().catch(() => false)) {
          visibleCount += 1;
        }
      }

      return [selector, { count, visibleCount }] as const;
    }),
  );

  return Object.fromEntries(entries);
}

async function executeSteps(page: Page, steps: BrowserActionStep[] = []): Promise<void> {
  for (const step of steps) {
    if (step.type === "fill") {
      await page.locator(step.selector).fill(step.value, { timeout: 10_000 });
    } else if (step.type === "click") {
      await page.locator(step.selector).click({ timeout: 10_000 });
    } else if (step.type === "press") {
      await page.locator(step.selector).press(step.key, { timeout: 10_000 });
    } else if (step.type === "waitForSelector") {
      await page.locator(step.selector).waitFor({
        state: "visible",
        timeout: step.timeoutMs ?? 10_000,
      });
    } else if (step.type === "waitForURLIncludes") {
      await page.waitForURL((url) => url.href.includes(step.value), {
        timeout: step.timeoutMs ?? 10_000,
      });
    } else {
      await page.waitForTimeout(step.ms);
    }
  }
}

async function collectDomProfile(
  page: Page,
  selectors: string[],
): Promise<DomProfile> {
  return page.evaluate(
    `(selectorList) => {
    const count = (selector) => document.querySelectorAll(selector).length;
    const styles = {};

    for (const selector of selectorList) {
      const element = document.querySelector(selector);
      if (!element) {
        continue;
      }

      const computed = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      styles[selector] = {
        fontSize: computed.fontSize,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        borderRadius: computed.borderRadius,
        width: Math.round(rect.width) + "px",
        height: Math.round(rect.height) + "px",
      };
    }

    return {
      landmarks: {
        nav: count("nav,[role='navigation']"),
        main: count("main,[role='main']"),
        form: count("form,[role='search'],[role='form']"),
        button: count("button,[role='button']"),
        link: count("a,[role='link']"),
        input: count("input,textarea,[role='textbox']"),
        list: count("ul,ol,[role='list']"),
        listitem: count("li,[role='listitem']"),
      },
      textSample: (document.body.innerText || "").slice(0, 4000),
      styles,
    };
  }`,
    selectors,
  ) as Promise<DomProfile>;
}

async function createPageSession(
  viewport: { width: number; height: number },
  side: CaptureSide,
): Promise<PageSession> {
  if (interactiveMode && side === "original") {
    const context: BrowserContext = await chromium.launchPersistentContext(
      interactiveProfileDir,
      {
        headless: false,
        viewport: { width: viewport.width, height: viewport.height },
      },
    );
    const page = context.pages()[0] ?? (await context.newPage());

    return {
      page,
      close: () => context.close(),
    };
  }

  const browser: Browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });

  return {
    page,
    close: () => browser.close(),
  };
}

async function waitForEnter(): Promise<void> {
  const readline = createInterface({ input, output });
  try {
    await readline.question("");
  } finally {
    readline.close();
  }
}

async function capturePageEvidence({
  target,
  state,
  side,
  page,
  url,
  viewport,
  criticalSelectors,
  compareSelectors,
  status,
  start,
  suffix,
  error,
  manualVerified,
}: CaptureEvidenceOptions): Promise<StateCapture> {
  const assetsDir = join(latestDir, "assets", target.id, state.id);
  await mkdir(assetsDir, { recursive: true });
  const screenshotPath = join(
    assetsDir,
    `${side}-${viewport.name}${suffix ? `-${suffix}` : ""}.png`,
  );
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const title = await page.title();
  const finalUrl = page.url();
  const bodyTextSample = await page
    .locator("body")
    .innerText({ timeout: 5_000 })
    .then((text) => text.slice(0, 4000))
    .catch(() => "");
  const metadata = await sharp(screenshotPath).metadata();

  return {
    stateId: state.id,
    side,
    viewport: viewport.name,
    requestedUrl: url,
    finalUrl,
    status,
    title,
    bodyTextSample,
    screenshotPath,
    screenshot: {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      blank: await isBlankScreenshot(screenshotPath),
    },
    selectors: await collectSelectors(page, criticalSelectors).catch(() => ({})),
    domProfile: await collectDomProfile(page, compareSelectors).catch(() => undefined),
    metrics: {
      loadTimeMs: Math.round(performance.now() - start),
    },
    error,
    manualVerified,
  };
}

function baselineJsonPath(target: PageTarget, state: PageStateConfig, viewportName: string): string {
  return join(baselineDir, target.id, state.id, `original-${viewportName}.json`);
}

function baselineScreenshotPath(
  target: PageTarget,
  state: PageStateConfig,
  viewportName: string,
): string {
  return join(baselineDir, target.id, state.id, `original-${viewportName}.png`);
}

async function saveBaselineCapture(
  target: PageTarget,
  state: PageStateConfig,
  capture: StateCapture,
): Promise<void> {
  if (
    capture.side !== "original" ||
    capture.fallbackFromBaseline ||
    capture.error ||
    !capture.screenshotPath ||
    !capture.screenshot ||
    capture.screenshot.blank
  ) {
    return;
  }

  const validation = validateStateCapture(target, state, capture);
  if (!validation.canScore) {
    return;
  }

  const screenshotPath = baselineScreenshotPath(target, state, capture.viewport);
  const jsonPath = baselineJsonPath(target, state, capture.viewport);
  await mkdir(join(baselineDir, target.id, state.id), { recursive: true });
  await copyFile(capture.screenshotPath, screenshotPath);
  await writeJsonFile(jsonPath, {
    ...capture,
    screenshotPath,
    fallbackFromBaseline: false,
    fallbackReason: undefined,
  });
}

async function loadBaselineCapture(
  target: PageTarget,
  state: PageStateConfig,
  viewportName: string,
  reason: string,
): Promise<StateCapture | undefined> {
  const jsonPath = baselineJsonPath(target, state, viewportName);

  try {
    const baseline = JSON.parse(await readFile(jsonPath, "utf8")) as StateCapture;
    return {
      ...baseline,
      fallbackFromBaseline: true,
      fallbackReason: reason,
      error: undefined,
      status: baseline.status ?? 200,
    };
  } catch {
    return undefined;
  }
}

async function collectState(
  target: PageTarget,
  state: PageStateConfig,
  side: CaptureSide,
): Promise<StateCapture> {
  const viewport = target.viewports[0] ?? { name: "desktop", width: 1365, height: 768 };
  let session: PageSession | undefined;
  let page: Page | undefined;
  const url =
    side === "original"
      ? state.originalUrl ?? target.originalUrl
      : state.replicaUrl ?? target.replicaUrl;
  const steps = side === "original" ? state.originalSteps : state.replicaSteps;
  const criticalSelectors = state.criticalSelectors ?? target.criticalSelectors;
  const compareSelectors = state.compareSelectors ?? criticalSelectors;
  const start = performance.now();

  try {
    session = await createPageSession(viewport, side);
    page = session.page;

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    await executeSteps(page, steps);
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);

    return await capturePageEvidence({
      target,
      state,
      side,
      page,
      url,
      viewport,
      criticalSelectors,
      compareSelectors,
      status: response?.status() ?? null,
      start,
    });
  } catch (error) {
    const errorMessage = summarizeError(error);

    if (page) {
      const failedCapture = await capturePageEvidence({
        target,
        state,
        side,
        page,
        url,
        viewport,
        criticalSelectors,
        compareSelectors,
        status: null,
        start,
        suffix: "failure",
        error: errorMessage,
      }).catch<StateCapture>(() => ({
        stateId: state.id,
        side,
        viewport: viewport.name,
        requestedUrl: url,
        finalUrl: page?.url() ?? url,
        status: null,
        title: "",
        bodyTextSample: "",
        selectors: {},
        error: errorMessage,
      }));

      if (interactiveMode && shouldOfferInteractiveRepair(failedCapture, side)) {
        console.error(
          buildInteractiveVerificationMessage({
            targetName: target.name,
            stateName: state.name,
            stateId: state.id,
            finalUrl: failedCapture.finalUrl,
            side,
          }),
        );
        await waitForEnter();
        await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => undefined);

        return await capturePageEvidence({
          target,
          state,
          side,
          page,
          url,
          viewport,
          criticalSelectors,
          compareSelectors,
          status: 200,
          start,
          manualVerified: true,
        }).catch<StateCapture>((retryError) => ({
          ...failedCapture,
          error: `${failedCapture.error ?? "原网页采集失败"}；人工验证后重新采集仍失败：${summarizeError(retryError)}`,
        }));
      }

      if (shouldUseScreenshotFallback(failedCapture, side, interactiveMode)) {
        const fallbackCapture = await loadBaselineCapture(
          target,
          state,
          viewport.name,
          failedCapture.error ?? "原网页采集遇到安全验证，使用最近一次成功截图基准降级评估。",
        );

        if (fallbackCapture) {
          console.warn(
            `原网页状态 ${target.id}/${state.id} 采集遇到验证问题，已使用最近一次成功截图基准降级评估。`,
          );
          return fallbackCapture;
        }
      }

      return failedCapture;
    }

    return {
      stateId: state.id,
      side,
      viewport: viewport.name,
      requestedUrl: url,
      finalUrl: url,
      status: null,
      title: "",
      bodyTextSample: "",
      selectors: {},
      error: errorMessage,
    };
  } finally {
    await session?.close().catch(() => undefined);
  }
}

async function compareScreenshots(
  target: PageTarget,
  stateId: string,
  original: StateCapture,
  replica: StateCapture,
): Promise<CaptureMetrics> {
  if (!original.screenshotPath || !replica.screenshotPath) {
    return {};
  }

  const width = Math.min(original.screenshot?.width ?? 0, replica.screenshot?.width ?? 0);
  const height = Math.min(original.screenshot?.height ?? 0, replica.screenshot?.height ?? 0);

  if (width <= 0 || height <= 0) {
    return {};
  }

  const [originalImage, replicaImage] = await Promise.all([
    sharp(original.screenshotPath)
      .resize(width, height, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer(),
    sharp(replica.screenshotPath)
      .resize(width, height, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer(),
  ]);
  const originalPixels = new Uint8ClampedArray(originalImage);
  const replicaPixels = new Uint8ClampedArray(replicaImage);
  const diff = new Uint8ClampedArray(width * height * 4);
  const diffPixels = pixelmatch(originalPixels, replicaPixels, diff, width, height, {
    threshold: 0.15,
  });
  const assetsDir = join(latestDir, "assets", target.id, stateId);
  const diffPath = join(assetsDir, `diff-${replica.viewport}.png`);
  await sharp(Buffer.from(diff), { raw: { width, height, channels: 4 } }).png().toFile(diffPath);

  let ssimValue = 0;
  try {
    const result = ssim(
      { data: originalPixels, width, height },
      { data: replicaPixels, width, height },
    );
    ssimValue = result.mssim;
  } catch {
    ssimValue = 0;
  }

  return {
    ...replica.metrics,
    screenshotDiffRatio: diffPixels / (width * height),
    ssim: ssimValue,
  };
}

const targets = await loadTargets();
const validations: PageEvaluationResult[] = [];
let hasFailure = false;

for (const target of targets) {
  const states = normalizeTargetStates(target);
  const originalCaptures: StateCapture[] = [];
  const replicaCaptures: StateCapture[] = [];

  for (const state of states) {
    const originalCapture = await collectState(target, state, "original");
    originalCaptures.push(originalCapture);
    await saveBaselineCapture(target, state, originalCapture);
    await writeJsonFile(
      join(latestDir, "captures", `${target.id}-${state.id}-original.json`),
      originalCapture,
    );
  }

  const validation = validateTargetStateCaptures(target, originalCaptures);

  if (validation.canScore) {
    for (const state of states) {
      const replicaCapture = await collectState(target, state, "replica");
      const originalCapture = originalCaptures.find((capture) => capture.stateId === state.id);
      if (originalCapture) {
        replicaCapture.metrics = await compareScreenshots(
          target,
          state.id,
          originalCapture,
          replicaCapture,
        );
      }

      replicaCaptures.push(replicaCapture);
      await writeJsonFile(
        join(latestDir, "captures", `${target.id}-${state.id}-replica.json`),
        replicaCapture,
      );
    }
  }

  validations.push({
    pageId: target.id,
    name: target.name,
    originalUrl: target.originalUrl,
    replicaUrl: target.replicaUrl,
    sourceValidation: validation,
    stateResults: validation.stateResults,
  });
  await writeJsonFile(join(latestDir, "captures", `${target.id}-source.json`), {
    original: originalCaptures,
    replica: replicaCaptures,
  });

  if (!validation.canScore) {
    hasFailure = true;
  }
}

await writeJsonFile(join(latestDir, "source-validation.json"), {
  generatedAt: new Date().toISOString(),
  pages: validations,
});

if (hasFailure || shouldInterruptEvaluation(validations)) {
  console.error(buildCaptureGateMessage(validations));
  process.exitCode = 1;
} else {
  console.log("原网页采集可信性门禁通过。");
}
