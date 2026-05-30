import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const configPath = join(projectRoot, "config", "target.json");
const baselinesDir = join(projectRoot, "baselines");
const sessionPath = join(projectRoot, "sources", "capture-session.md");
const decisionsPath = join(projectRoot, "logs", "decisions.md");
const blockersPath = join(projectRoot, "logs", "blockers.md");
const resumeSignalFile = join(projectRoot, "captures", "verification-resume.json");
const profileDir = join(projectRoot, "captures", "playwright-google-profile");
const config = JSON.parse(await readFile(configPath, "utf8"));
const headless = false;
const captureMayNeedVerification = true;

if (captureMayNeedVerification && headless !== false) {
  throw new Error("Verification handoff requires a visible headed browser window.");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function isBlankScreenshot(path) {
  const stats = await sharp(path).stats();
  const deviation = stats.channels.reduce((total, channel) => total + channel.stdev, 0);
  return deviation < 1;
}

function selectorsForState(state) {
  return Array.from(
    new Set([
      ...(state.criticalSelectors ?? config.criticalSelectors ?? []),
      ...(state.compareSelectors ?? config.compareSelectors ?? []),
      ...((state.regions ?? []).map((region) => region.selector)),
      "body",
      "form",
      "textarea[name='q'], input[name='q']",
    ]),
  );
}

async function collectSelectors(page, selectors) {
  const entries = await Promise.all(
    selectors.map(async (selector) => {
      const locator = page.locator(selector);
      const count = await locator.count().catch(() => 0);
      let visibleCount = 0;
      for (let index = 0; index < count; index += 1) {
        if (await locator.nth(index).isVisible().catch(() => false)) {
          visibleCount += 1;
        }
      }
      return [selector, { count, visibleCount }];
    }),
  );
  return Object.fromEntries(entries);
}

async function collectDomProfile(page, selectors) {
  return page.evaluate((selectorList) => {
    const count = (selector) => document.querySelectorAll(selector).length;
    const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
    const areaFor = (elements) => Array.from(elements).reduce((total, element) => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
      const height = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      return total + width * height;
    }, 0);
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
        width: `${Math.round(rect.width)}px`,
        height: `${Math.round(rect.height)}px`,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        display: computed.display,
        fontWeight: computed.fontWeight,
        lineHeight: computed.lineHeight,
      };
    }

    const focusableElements = Array.from(document.querySelectorAll("button,a[href],input,select,textarea,[tabindex]:not([tabindex='-1']),[role='button'],[role='textbox']"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      });
    const backgroundElements = Array.from(document.querySelectorAll("body *")).filter((element) => {
      const style = window.getComputedStyle(element);
      return style.backgroundImage && style.backgroundImage !== "none";
    });
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
  }, selectors);
}

async function detectVerification(page) {
  const snapshot = `${page.url()}\n${await page.title().catch(() => "")}\n${await page.locator("body").innerText({ timeout: 3000 }).catch(() => "")}`.toLowerCase();
  return /captcha|unusual traffic|sorry|security check|verify|access denied|安全验证|验证码|访问受限|拒绝访问/.test(snapshot);
}

async function writeCaptureSession(state, url, verificationSignal, result = "capturing") {
  const content = `# Capture Session

- Browser provider: Playwright headed
- Profile/session path: ${profileDir}
- Locked session id/provider: playwright-headed / ${state.id}
- Target state and URL: ${state.id} / ${url}
- Current verification URL: ${verificationSignal ? url : "none"}
- Verification signal detected: ${verificationSignal ? "yes" : "no"}
- Recovery signal file: ${resumeSignalFile}
- Verification handoff note: user must complete verification in the already-opened browser window/tab
- User handoff time: ${verificationSignal ? new Date().toISOString() : "not needed"}
- Post-verification gate result: ${result}
`;
  await writeFile(sessionPath, content);
}

async function waitForVerificationResume(page, state, url) {
  await writeCaptureSession(state, url, true, "waiting for user");
  while (!(await exists(resumeSignalFile))) {
    await sleep(2000);
  }
  await rm(resumeSignalFile, { force: true });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
  if (await detectVerification(page)) {
    throw new Error("Verification still present after user handoff.");
  }
  await writeCaptureSession(state, url, false, "passed after resume");
}

async function captureScrollSlices(page, stateDir) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(stateDir, "original-top.png"), fullPage: false });

  const metrics = await page.evaluate(() => ({
    viewport: window.innerHeight,
    height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
  }));
  const middleY = Math.max(0, Math.round((metrics.height - metrics.viewport) / 2));
  const bottomY = Math.max(0, metrics.height - metrics.viewport);

  await page.evaluate((y) => window.scrollTo(0, y), middleY);
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(stateDir, "original-middle.png"), fullPage: false });

  await page.evaluate((y) => window.scrollTo(0, y), bottomY);
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(stateDir, "original-bottom.png"), fullPage: false });

  await page.evaluate(() => window.scrollTo(0, 0));
}

async function captureState(context, state, viewport) {
  const stateDir = join(baselinesDir, state.id);
  await mkdir(stateDir, { recursive: true });
  const page = await context.newPage();
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const url = state.originalUrl ?? config.originalUrl;

  await writeCaptureSession(state, url, false);
  const startedAt = performance.now();
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);

  if (await detectVerification(page)) {
    await waitForVerificationResume(page, state, url);
  }

  await page.screenshot({ path: join(stateDir, `original-${viewport.name}.png`), fullPage: false });
  await captureScrollSlices(page, stateDir);

  const selectors = selectorsForState(state);
  const bodyTextSample = await page.locator("body").innerText({ timeout: 5000 }).then((text) => text.slice(0, 4000));
  const screenshotPath = join(stateDir, `original-${viewport.name}.png`);
  const metadata = await sharp(screenshotPath).metadata();
  const dom = {
    stateId: state.id,
    side: "original",
    viewport: viewport.name,
    requestedUrl: url,
    finalUrl: page.url(),
    status: response?.status() ?? 200,
    title: await page.title(),
    bodyTextSample,
    screenshotPath,
    screenshot: {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      blank: await isBlankScreenshot(screenshotPath),
    },
    selectors: await collectSelectors(page, selectors),
    domProfile: await collectDomProfile(page, selectors),
    metrics: {
      loadTimeMs: Math.round(performance.now() - startedAt),
    },
    manualVerified: false,
  };
  await writeFile(join(stateDir, "original-dom.json"), JSON.stringify(dom, null, 2));
  await writeFile(
    join(stateDir, "capture-notes.md"),
    `# ${state.name}

- state id: ${state.id}
- source URL: ${url}
- final URL: ${dom.finalUrl}
- browser/session used: Playwright headed, profile ${profileDir}
- head/top captured: yes, \`original-top.png\`
- middle captured: yes, \`original-middle.png\`
- footer/bottom captured: yes, \`original-bottom.png\`
- viewport captured: yes, \`original-${viewport.name}.png\`
- DOM/style summary saved: yes, \`original-dom.json\`
- blank screenshot: ${dom.screenshot.blank ? "yes" : "no"}
- status: ${dom.status}
`,
  );

  await page.close();
  return dom;
}

await mkdir(baselinesDir, { recursive: true });
await mkdir(profileDir, { recursive: true });
const browserContext = await chromium.launchPersistentContext(profileDir, {
  headless,
  viewport: null,
  locale: "en-US",
  args: ["--disable-blink-features=AutomationControlled"],
});

try {
  const viewport = config.viewports[0] ?? { name: "desktop", width: 1365, height: 768 };
  const captures = [];
  for (const state of config.states) {
    captures.push(await captureState(browserContext, state, viewport));
  }

  await writeFile(
    decisionsPath,
    `${await readFile(decisionsPath, "utf8")}

## Phase 3 Capture

- Captured ${captures.length} required Google states using Playwright headed.
- Saved viewport, top, middle, bottom screenshots and DOM/style summaries under \`projects/google-search/baselines/\`.
- Verification handoff was not required unless noted in \`sources/capture-session.md\`.
`,
  );
  console.log(JSON.stringify(captures.map((capture) => ({
    stateId: capture.stateId,
    finalUrl: capture.finalUrl,
    title: capture.title,
    textSample: capture.bodyTextSample.slice(0, 120),
    selectors: capture.selectors,
  })), null, 2));
} catch (error) {
  await writeFile(
    blockersPath,
    `${await readFile(blockersPath, "utf8")}

## Phase 3 Capture Blocker

- ${error instanceof Error ? error.message : String(error)}
`,
  );
  throw error;
} finally {
  await browserContext.close().catch(() => undefined);
}
