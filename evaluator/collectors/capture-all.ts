import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { ssim } from "ssim.js";
import { loadTargets } from "../core/targets.js";
import { buildCaptureGateMessage, shouldInterruptEvaluation } from "../core/captureGate.js";
import { normalizeTargetStates, validateTargetStateCaptures } from "../core/stateValidation.js";
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

async function collectState(
  target: PageTarget,
  state: PageStateConfig,
  side: CaptureSide,
): Promise<StateCapture> {
  const viewport = target.viewports[0] ?? { name: "desktop", width: 1365, height: 768 };
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
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
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    await executeSteps(page, steps);
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);

    const assetsDir = join(latestDir, "assets", target.id, state.id);
    await mkdir(assetsDir, { recursive: true });
    const screenshotPath = join(assetsDir, `${side}-${viewport.name}.png`);
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
      status: response?.status() ?? null,
      title,
      bodyTextSample,
      screenshotPath,
      screenshot: {
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
        blank: await isBlankScreenshot(screenshotPath),
      },
      selectors: await collectSelectors(page, criticalSelectors),
      domProfile: await collectDomProfile(page, compareSelectors),
      metrics: {
        loadTimeMs: Math.round(performance.now() - start),
      },
    };
  } catch (error) {
    const assetsDir = join(latestDir, "assets", target.id, state.id);
    const screenshotPath = join(assetsDir, `${side}-${viewport.name}-failure.png`);
    let screenshot: StateCapture["screenshot"] | undefined;
    let bodyTextSample = "";
    let selectors: Record<string, SelectorCapture> = {};

    if (page) {
      await mkdir(assetsDir, { recursive: true }).catch(() => undefined);
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => undefined);
      const metadata = await sharp(screenshotPath).metadata().catch(() => undefined);
      if (metadata) {
        screenshot = {
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
          blank: await isBlankScreenshot(screenshotPath).catch(() => true),
        };
      }
      bodyTextSample = await page
        .locator("body")
        .innerText({ timeout: 2_000 })
        .then((text) => text.slice(0, 4000))
        .catch(() => "");
      selectors = await collectSelectors(page, criticalSelectors).catch(() => ({}));
    }

    return {
      stateId: state.id,
      side,
      viewport: viewport.name,
      requestedUrl: url,
      finalUrl: page?.url() ?? url,
      status: null,
      title: page ? await page.title().catch(() => "") : "",
      bodyTextSample,
      screenshotPath: screenshot ? screenshotPath : undefined,
      screenshot,
      selectors,
      error: summarizeError(error),
    };
  } finally {
    await browser?.close().catch(() => undefined);
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
