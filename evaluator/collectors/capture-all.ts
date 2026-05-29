import { copyFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { ssim } from "ssim.js";
import { loadTargets } from "../core/targets.js";
import { executeBrowserAction } from "../core/assertions.js";
import { buildCaptureGateMessage, shouldInterruptEvaluation } from "../core/captureGate.js";
import { latestEvaluationDirFor } from "../core/evaluationPaths.js";
import {
  normalizeTargetStates,
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
  RegionVisualScore,
  SelectorCapture,
  StateCapture,
} from "../core/types.js";

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
  reportDir: string;
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
      await executeBrowserAction(page, step);
    } else if (step.type === "click") {
      await executeBrowserAction(page, step);
    } else if (step.type === "press") {
      await executeBrowserAction(page, step);
    } else if (step.type === "waitForSelector") {
      await executeBrowserAction(page, step);
    } else if (step.type === "waitForURLIncludes") {
      await executeBrowserAction(page, step);
    } else {
      await executeBrowserAction(page, step);
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
    const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
    const areaFor = (elements) => Array.from(elements).reduce((total, element) => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
      const height = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      return total + width * height;
    }, 0);
    const backgroundElements = Array.from(document.querySelectorAll("body *")).filter((element) => {
      const style = window.getComputedStyle(element);
      return style.backgroundImage && style.backgroundImage !== "none";
    });
    const focusableElements = Array.from(document.querySelectorAll("button,a[href],input,select,textarea,[tabindex]:not([tabindex='-1']),[role='button'],[role='textbox']"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      });
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
        borderColor: computed.borderColor,
        borderRadius: computed.borderRadius,
        width: Math.round(rect.width) + "px",
        height: Math.round(rect.height) + "px",
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        display: computed.display,
        fontWeight: computed.fontWeight,
        lineHeight: computed.lineHeight,
      };
    }

    const bodyText = document.body.innerText || "";

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
      textSample: bodyText.slice(0, 4000),
      textNodeLength: bodyText.trim().length,
      imageAreaRatio: Math.min(1, areaFor(document.querySelectorAll("img,svg image")) / viewportArea),
      canvasAreaRatio: Math.min(1, areaFor(document.querySelectorAll("canvas")) / viewportArea),
      backgroundImageAreaRatio: Math.min(1, areaFor(backgroundElements) / viewportArea),
      interactiveControlCount: count("button,a[href],input,select,textarea,[role='button'],[role='textbox']"),
      focusableControlCount: focusableElements.length,
      base64ImageCount: Array.from(document.querySelectorAll("img")).filter((image) => image.src.startsWith("data:")).length,
      styles,
    };
  }`,
    selectors,
  ) as Promise<DomProfile>;
}

async function createPageSession(
  viewport: { width: number; height: number },
): Promise<PageSession> {
  const browser: Browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });

  return {
    page,
    close: () => browser.close(),
  };
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
  reportDir,
  status,
  start,
  suffix,
  error,
  manualVerified,
}: CaptureEvidenceOptions): Promise<StateCapture> {
  const assetsDir = join(reportDir, "assets", target.id, state.id);
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

function targetBaselineDir(target: PageTarget): string {
  return target.baselineDir ?? join(process.cwd(), "projects", target.id, "baselines");
}

function baselineScreenshotPath(target: PageTarget, state: PageStateConfig, viewportName: string): string {
  return join(targetBaselineDir(target), state.id, `original-${viewportName}.png`);
}

function baselineDomPath(target: PageTarget, state: PageStateConfig): string {
  return join(targetBaselineDir(target), state.id, "original-dom.json");
}

async function loadProjectBaselineCapture(
  target: PageTarget,
  state: PageStateConfig,
  viewportName: string,
  reportDir: string,
): Promise<StateCapture> {
  const jsonPath = baselineDomPath(target, state);
  const sourceScreenshotPath = baselineScreenshotPath(target, state, viewportName);
  const reportAssetsDir = join(reportDir, "assets", target.id, state.id);
  const reportScreenshotPath = join(reportAssetsDir, `original-${viewportName}.png`);

  try {
    await mkdir(reportAssetsDir, { recursive: true });
    const baseline = JSON.parse(await readFile(jsonPath, "utf8")) as StateCapture;
    await copyFile(sourceScreenshotPath, reportScreenshotPath);
    const metadata = await sharp(reportScreenshotPath).metadata();

    return {
      ...baseline,
      stateId: state.id,
      side: "original",
      viewport: viewportName,
      requestedUrl: state.originalUrl ?? target.originalUrl,
      screenshotPath: reportScreenshotPath,
      screenshot: {
        width: metadata.width ?? baseline.screenshot?.width ?? 0,
        height: metadata.height ?? baseline.screenshot?.height ?? 0,
        blank: await isBlankScreenshot(reportScreenshotPath),
      },
      fromProjectBaseline: true,
      baselinePath: jsonPath,
      fallbackFromBaseline: false,
      fallbackReason: undefined,
      error: undefined,
      status: baseline.status ?? 200,
    };
  } catch (error) {
    const message = summarizeError(error);
    return {
      stateId: state.id,
      side: "original",
      viewport: viewportName,
      requestedUrl: state.originalUrl ?? target.originalUrl,
      finalUrl: state.originalUrl ?? target.originalUrl,
      status: null,
      title: "",
      bodyTextSample: "",
      selectors: {},
      fromProjectBaseline: true,
      baselinePath: jsonPath,
      error: `缺少或无法读取 Phase 3 原站基线文件：${jsonPath} / ${sourceScreenshotPath}；${message}`,
    };
  }
}

async function collectState(
  target: PageTarget,
  state: PageStateConfig,
  side: CaptureSide,
  viewport: { name: string; width: number; height: number },
  reportDir: string,
): Promise<StateCapture> {
  let session: PageSession | undefined;
  let page: Page | undefined;
  const url =
    side === "original"
      ? state.originalUrl ?? target.originalUrl
      : state.replicaUrl ?? target.replicaUrl;
  const steps = side === "original" ? state.originalSteps : state.replicaSteps;
  const criticalSelectors = state.criticalSelectors ?? target.criticalSelectors;
  const compareSelectors = Array.from(
    new Set([...(state.compareSelectors ?? criticalSelectors), ...(state.regions?.map((region) => region.selector) ?? [])]),
  );
  const start = performance.now();

  try {
    session = await createPageSession(viewport);
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
      reportDir,
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
        reportDir,
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
  state: PageStateConfig,
  original: StateCapture,
  replica: StateCapture,
  reportDir: string,
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
  const assetsDir = join(reportDir, "assets", target.id, state.id);
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
    regionScores: await compareRegions(target, state, original, replica, reportDir),
    layoutScore: calculateLayoutScore(state, original, replica),
    styleScore: calculateStyleScore(state, original, replica),
  };
}

function numericStyle(value: string | number | undefined): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function boxScore(original: Record<string, unknown>, replica: Record<string, unknown>): number {
  const keys = ["x", "y", "width", "height"];
  const scores = keys.map((key) => {
    const a = numericStyle(original[key] as string | number | undefined);
    const b = numericStyle(replica[key] as string | number | undefined);
    if (typeof a !== "number" || typeof b !== "number") {
      return 0;
    }
    const tolerance = key === "width" || key === "height" ? Math.max(4, a * 0.05) : 4;
    const delta = Math.abs(a - b);
    return Math.max(0, 100 - Math.max(0, delta - tolerance) * 4);
  });
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function calculateLayoutScore(
  state: PageStateConfig,
  original: StateCapture,
  replica: StateCapture,
): number {
  const selectors = state.compareSelectors ?? state.criticalSelectors ?? [];
  const scores = selectors.map((selector) => {
    const originalStyle = original.domProfile?.styles[selector];
    const replicaStyle = replica.domProfile?.styles[selector];
    return originalStyle && replicaStyle ? boxScore(originalStyle, replicaStyle) : 0;
  });
  return scores.length === 0 ? 0 : scores.reduce((total, score) => total + score, 0) / scores.length;
}

function colorDistance(a: string | undefined, b: string | undefined): number {
  const parse = (value: string | undefined) =>
    value?.match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number) ?? [];
  const left = parse(a);
  const right = parse(b);
  if (left.length < 3 || right.length < 3) {
    return 255;
  }
  return Math.sqrt(
    (left[0] - right[0]) ** 2 +
      (left[1] - right[1]) ** 2 +
      (left[2] - right[2]) ** 2,
  );
}

function calculateStyleScore(
  state: PageStateConfig,
  original: StateCapture,
  replica: StateCapture,
): number {
  const selectors = state.compareSelectors ?? state.criticalSelectors ?? [];
  const scores = selectors.map((selector) => {
    const originalStyle = original.domProfile?.styles[selector];
    const replicaStyle = replica.domProfile?.styles[selector];
    if (!originalStyle || !replicaStyle) {
      return 0;
    }

    const fontScore = Math.max(
      0,
      100 - Math.abs((numericStyle(originalStyle.fontSize) ?? 0) - (numericStyle(replicaStyle.fontSize) ?? 0)) * 20,
    );
    const radiusScore = Math.max(
      0,
      100 - Math.abs((numericStyle(originalStyle.borderRadius) ?? 0) - (numericStyle(replicaStyle.borderRadius) ?? 0)) * 10,
    );
    const colorScore = Math.max(0, 100 - colorDistance(originalStyle.color, replicaStyle.color) * 2);
    const backgroundScore = Math.max(
      0,
      100 - colorDistance(originalStyle.backgroundColor, replicaStyle.backgroundColor) * 2,
    );
    return fontScore * 0.3 + radiusScore * 0.2 + colorScore * 0.25 + backgroundScore * 0.25;
  });
  return scores.length === 0 ? 0 : scores.reduce((total, score) => total + score, 0) / scores.length;
}

async function compareRegions(
  target: PageTarget,
  state: PageStateConfig,
  original: StateCapture,
  replica: StateCapture,
  reportDir: string,
): Promise<RegionVisualScore[]> {
  if (!original.screenshotPath || !replica.screenshotPath || !state.regions?.length) {
    return [];
  }

  const regionsDir = join(reportDir, "assets", target.id, state.id, "regions");
  await mkdir(regionsDir, { recursive: true });
  const scores: RegionVisualScore[] = [];

  for (const region of state.regions) {
    const originalStyle = original.domProfile?.styles[region.selector];
    const replicaStyle = replica.domProfile?.styles[region.selector];
    const width = Math.round(Math.min(numericStyle(originalStyle?.width) ?? 0, numericStyle(replicaStyle?.width) ?? 0));
    const height = Math.round(Math.min(numericStyle(originalStyle?.height) ?? 0, numericStyle(replicaStyle?.height) ?? 0));
    const left = Math.round(Math.max(0, numericStyle(originalStyle?.x) ?? 0));
    const top = Math.round(Math.max(0, numericStyle(originalStyle?.y) ?? 0));
    const replicaLeft = Math.round(Math.max(0, numericStyle(replicaStyle?.x) ?? 0));
    const replicaTop = Math.round(Math.max(0, numericStyle(replicaStyle?.y) ?? 0));

    if (width <= 0 || height <= 0) {
      continue;
    }

    const originalPath = join(regionsDir, `original-${region.id}-${replica.viewport}.png`);
    const replicaPath = join(regionsDir, `replica-${region.id}-${replica.viewport}.png`);
    const diffPath = join(regionsDir, `diff-${region.id}-${replica.viewport}.png`);

    await sharp(original.screenshotPath)
      .extract({ left, top, width, height })
      .png()
      .toFile(originalPath)
      .catch(() => undefined);
    await sharp(replica.screenshotPath)
      .extract({ left: replicaLeft, top: replicaTop, width, height })
      .png()
      .toFile(replicaPath)
      .catch(() => undefined);

    const [originalImage, replicaImage] = await Promise.all([
      sharp(originalPath).ensureAlpha().raw().toBuffer(),
      sharp(replicaPath).ensureAlpha().raw().toBuffer(),
    ]).catch(() => []);

    if (!originalImage || !replicaImage) {
      continue;
    }

    const originalPixels = new Uint8ClampedArray(originalImage);
    const replicaPixels = new Uint8ClampedArray(replicaImage);
    const diff = new Uint8ClampedArray(width * height * 4);
    const diffPixels = pixelmatch(originalPixels, replicaPixels, diff, width, height, {
      threshold: 0.15,
    });
    await sharp(Buffer.from(diff), { raw: { width, height, channels: 4 } }).png().toFile(diffPath);

    const diffRatio = diffPixels / (width * height);
    const pixelScore = Math.max(0, 100 - diffRatio * 100);
    let ssimValue = 0;
    try {
      ssimValue = ssim(
        { data: originalPixels, width, height },
        { data: replicaPixels, width, height },
      ).mssim;
    } catch {
      ssimValue = 0;
    }

    const ssimScore = Math.max(0, Math.min(100, ssimValue * 100));
    const bboxScore = originalStyle && replicaStyle ? boxScore(originalStyle, replicaStyle) : 0;
    const styleScore = calculateStyleScore(
      { ...state, compareSelectors: [region.selector] },
      original,
      replica,
    );
    const score = pixelScore * 0.45 + ssimScore * 0.35 + bboxScore * 0.12 + styleScore * 0.08;

    scores.push({
      stateId: state.id,
      regionId: region.id,
      selector: region.selector,
      weight: region.weight ?? 1,
      score,
      pixelScore,
      ssimScore,
      bboxScore,
      styleScore,
      diffRatio,
      ssim: ssimValue,
      originalPath,
      replicaPath,
      diffPath,
    });
  }

  return scores;
}

const targets = await loadTargets();
const validations: PageEvaluationResult[] = [];
let hasFailure = false;

for (const target of targets) {
  const states = normalizeTargetStates(target);
  const originalCaptures: StateCapture[] = [];
  const replicaCaptures: StateCapture[] = [];
  const viewports = target.viewports.length > 0
    ? target.viewports
    : [{ name: "desktop", width: 1365, height: 768 }];
  const reportDir = latestEvaluationDirFor(target);
  await mkdir(join(reportDir, "captures"), { recursive: true });

  for (const state of states) {
    for (const viewport of viewports) {
      const originalCapture = await loadProjectBaselineCapture(target, state, viewport.name, reportDir);
      originalCaptures.push(originalCapture);
      await writeJsonFile(
        join(reportDir, "captures", `${target.id}-${state.id}-${viewport.name}-original.json`),
        originalCapture,
      );
    }
  }

  const validation = validateTargetStateCaptures(target, originalCaptures);

  if (validation.canScore) {
    for (const state of states) {
      for (const viewport of viewports) {
        const replicaCapture = await collectState(target, state, "replica", viewport, reportDir);
        const originalCapture = originalCaptures.find(
          (capture) => capture.stateId === state.id && capture.viewport === viewport.name,
        );
        if (originalCapture) {
          replicaCapture.metrics = await compareScreenshots(
            target,
            state,
            originalCapture,
            replicaCapture,
            reportDir,
          );
        }

        replicaCaptures.push(replicaCapture);
        await writeJsonFile(
          join(reportDir, "captures", `${target.id}-${state.id}-${viewport.name}-replica.json`),
          replicaCapture,
        );
      }
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
  await writeJsonFile(join(reportDir, "captures", `${target.id}-source.json`), {
    original: originalCaptures,
    replica: replicaCaptures,
  });

  if (!validation.canScore) {
    hasFailure = true;
  }
}

const reportDir = latestEvaluationDirFor(targets[0]);
await writeJsonFile(join(reportDir, "source-validation.json"), {
  generatedAt: new Date().toISOString(),
  pages: validations,
});

if (hasFailure || shouldInterruptEvaluation(validations)) {
  console.error(buildCaptureGateMessage(validations));
  process.exitCode = 1;
} else {
  console.log("Phase 3 原网页截图/DOM 基线可信性门禁通过。");
}
