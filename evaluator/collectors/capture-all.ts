import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import sharp from "sharp";
import { loadTargets } from "../core/targets.js";
import { validateSourceCapture } from "../core/sourceValidation.js";
import { writeJsonFile } from "../core/files.js";
import type { PageTarget, SelectorCapture, SourceCapture } from "../core/types.js";

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

async function collectSource(target: PageTarget): Promise<SourceCapture> {
  const viewport = target.viewports[0] ?? { name: "desktop", width: 1365, height: 768 };
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  let page: Page | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });

    const response = await page.goto(target.originalUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);

    const assetsDir = join(latestDir, "assets", target.id);
    await mkdir(assetsDir, { recursive: true });
    const screenshotPath = join(assetsDir, `original-${viewport.name}.png`);
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
      requestedUrl: target.originalUrl,
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
      selectors: await collectSelectors(page, target.criticalSelectors),
    };
  } catch (error) {
    return {
      requestedUrl: target.originalUrl,
      finalUrl: page?.url() ?? target.originalUrl,
      status: null,
      title: page ? await page.title().catch(() => "") : "",
      bodyTextSample: "",
      selectors: {},
      error: summarizeError(error),
    };
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

const targets = await loadTargets();
const validations = [];
let hasFailure = false;

for (const target of targets) {
  const capture = await collectSource(target);
  const validation = validateSourceCapture(target, capture);
  validations.push({ target, capture, validation });
  await writeJsonFile(join(latestDir, "captures", `${target.id}-source.json`), capture);

  if (!validation.canScore) {
    hasFailure = true;
  }
}

await writeJsonFile(join(latestDir, "source-validation.json"), {
  generatedAt: new Date().toISOString(),
  pages: validations.map(({ target, validation }) => ({
    pageId: target.id,
    name: target.name,
    originalUrl: target.originalUrl,
    replicaUrl: target.replicaUrl,
    sourceValidation: validation,
  })),
});

if (hasFailure) {
  console.error("原网页采集可信性门禁失败，失败页面不会进入评分。详情见 reports/latest/source-validation.json。");
} else {
  console.log("原网页采集可信性门禁通过。");
}
