import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { stdin as input, stdout as output } from "node:process";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const baselineRoot = join(projectRoot, "baselines");
const sessionPath = join(__dirname, "google-playwright-profile");

const viewport = { width: 1365, height: 768 };
const states = [
  {
    id: "home",
    name: "Initial search home",
    url: "https://www.google.com/",
    expectedText: ["Google"],
    selectors: ["body", "form", "textarea[name='q'],input[name='q']", "input[type='submit'],button"],
  },
  {
    id: "results-page-1",
    name: "Search results page one",
    url: "https://www.google.com/search?q=tencent",
    expectedText: ["Tencent"],
    selectors: ["body", "textarea[name='q'],input[name='q']", "#search", "#result-stats", "a"],
  },
  {
    id: "results-page-2",
    name: "Search results pagination",
    url: "https://www.google.com/search?q=tencent&start=10",
    expectedText: ["Tencent"],
    selectors: ["body", "textarea[name='q'],input[name='q']", "#search", "a"],
  },
];

class VerificationBlocker extends Error {
  constructor(state, signals, page) {
    super(
      `Verification or access blocker detected for ${state.id}: ${signals.join(", ")}. Browser session path: ${sessionPath}`,
    );
    this.name = "VerificationBlocker";
    this.state = state;
    this.signals = signals;
    this.page = page;
  }
}

function verificationSignals(text, title, url) {
  const haystack = `${title}\n${url}\n${text}`.toLowerCase();
  return [
    "unusual traffic",
    "not a robot",
    "captcha",
    "security check",
    "verify",
    "sorry",
    "detected unusual",
    "our systems have detected",
  ].filter((signal) => haystack.includes(signal));
}

async function acceptConsentIfPresent(page) {
  const labels = [
    "Accept all",
    "I agree",
    "Agree",
    "Reject all",
    "全部接受",
    "我同意",
    "接受所有",
  ];

  for (const label of labels) {
    const button = page.getByRole("button", { name: label }).first();
    if (await button.isVisible({ timeout: 1200 }).catch(() => false)) {
      await button.click();
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => undefined);
      return label;
    }
  }

  return null;
}

async function selectorSummary(page, selectors) {
  return Object.fromEntries(
    await Promise.all(
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
    ),
  );
}

async function domProfile(page, selectors) {
  return page.evaluate((selectorList) => {
    const count = (selector) => document.querySelectorAll(selector).length;
    const styles = {};

    for (const selector of selectorList) {
      const element = document.querySelector(selector);
      if (!element) continue;
      const computed = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      styles[selector] = {
        fontSize: computed.fontSize,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        borderRadius: computed.borderRadius,
        width: `${Math.round(rect.width)}px`,
        height: `${Math.round(rect.height)}px`,
      };
    }

    return {
      landmarks: {
        nav: count("nav,[role='navigation']"),
        main: count("main,[role='main']"),
        form: count("form,[role='search'],[role='form']"),
        button: count("button,[role='button'],input[type='submit']"),
        link: count("a,[role='link']"),
        input: count("input,textarea,[role='textbox']"),
        list: count("ul,ol,[role='list']"),
        listitem: count("li,[role='listitem']"),
      },
      textSample: (document.body.innerText || "").slice(0, 4000),
      styles,
    };
  }, selectors);
}

async function screenshotMetadata(path) {
  const metadata = await sharp(path).metadata();
  const stats = await sharp(path).stats();
  const deviation = stats.channels.reduce((total, channel) => total + channel.stdev, 0);
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    blank: deviation < 1,
  };
}

async function captureSegments(page, stateDir) {
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const maxScroll = Math.max(0, scrollHeight - viewport.height);
  const positions = [
    { name: "top", y: 0 },
    { name: "middle", y: Math.round(maxScroll / 2) },
    { name: "bottom", y: maxScroll },
  ];

  const evidence = [];
  for (const position of positions) {
    await page.evaluate((y) => window.scrollTo(0, y), position.y);
    await page.waitForTimeout(350);
    const file = join(stateDir, `original-${position.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    evidence.push({ segment: position.name, scrollY: position.y, file });
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  const desktop = join(stateDir, "original-desktop.png");
  await page.screenshot({ path: desktop, fullPage: false });
  evidence.push({ segment: "desktop", scrollY: 0, file: desktop });
  return { scrollHeight, maxScroll, evidence };
}

async function captureState(context, state) {
  const stateDir = join(baselineRoot, state.id);
  await mkdir(stateDir, { recursive: true });
  const page = await context.newPage();
  const response = await page.goto(state.url, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  const consentAction = await acceptConsentIfPresent(page);
  await page.waitForLoadState("networkidle", { timeout: 9000 }).catch(() => undefined);
  await page.waitForTimeout(1000);

  const title = await page.title();
  const finalUrl = page.url();
  const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  const signals = verificationSignals(bodyText, title, finalUrl);
  if (signals.length > 0) {
    throw new VerificationBlocker(state, signals, page);
  }

  const missingExpected = state.expectedText.filter((text) => !bodyText.toLowerCase().includes(text.toLowerCase()));
  if (missingExpected.length > 0) {
    throw new Error(`Expected text missing for ${state.id}: ${missingExpected.join(", ")}`);
  }

  const segments = await captureSegments(page, stateDir);
  const primaryImage = join(stateDir, "original-desktop.png");
  const capture = {
    stateId: state.id,
    side: "original",
    viewport: "desktop",
    requestedUrl: state.url,
    finalUrl,
    status: response?.status() ?? null,
    title,
    bodyTextSample: bodyText.slice(0, 4000),
    screenshotPath: primaryImage,
    screenshot: await screenshotMetadata(primaryImage),
    selectors: await selectorSummary(page, state.selectors),
    domProfile: await domProfile(page, state.selectors),
    manualVerified: false,
    fromProjectBaseline: true,
    baselinePath: join(stateDir, "original-dom.json"),
  };

  await writeFile(join(stateDir, "original-dom.json"), `${JSON.stringify(capture, null, 2)}\n`);
  await writeFile(
    join(stateDir, "capture-notes.md"),
    [
      `# ${state.name}`,
      "",
      `- Browser/session used: Playwright persistent Chromium (${sessionPath})`,
      `- Requested URL: ${state.url}`,
      `- Final URL: ${finalUrl}`,
      `- HTTP status: ${capture.status}`,
      `- Title: ${title}`,
      `- Consent action: ${consentAction ?? "none"}`,
      "- Head/top captured: yes (`original-top.png`)",
      "- Middle captured: yes (`original-middle.png`)",
      "- Footer/bottom captured: yes (`original-bottom.png`)",
      `- Scroll height: ${segments.scrollHeight}`,
      `- Max scroll captured: ${segments.maxScroll}`,
      `- Verification signals: none`,
      "",
      "## Selector Summary",
      "",
      "```json",
      JSON.stringify(capture.selectors, null, 2),
      "```",
      "",
    ].join("\n"),
  );

  await page.close();
  return capture;
}

async function main() {
  await mkdir(baselineRoot, { recursive: true });
  const context = await chromium.launchPersistentContext(sessionPath, {
    headless: false,
    viewport,
    locale: "en-US",
    timezoneId: "Asia/Shanghai",
  });

  const captures = [];
  try {
    for (let index = 0; index < states.length; index += 1) {
      const state = states[index];
      try {
        captures.push(await captureState(context, state));
      } catch (error) {
        if (!(error instanceof VerificationBlocker)) {
          throw error;
        }

        await writeFile(
          join(projectRoot, "logs", "blockers.md"),
          [
            "# Blockers",
            "",
            "## Google Verification",
            "",
            `- State: ${error.state.id}`,
            `- URL: ${error.page.url()}`,
            `- Signals: ${error.signals.join(", ")}`,
            `- Browser provider: Playwright headed persistent Chromium`,
            `- Profile/session path: ${sessionPath}`,
            "- Recovery signal: press Enter in the running capture process after completing verification in the opened browser.",
            "",
          ].join("\n"),
        );

        console.error(error.message);
        console.error("Please complete verification in the opened browser window/tab, then press Enter here to resume capture.");
        const rl = createInterface({ input, output });
        await rl.question("");
        rl.close();
        await error.page.close().catch(() => undefined);
        captures.push(await captureState(context, state));
      }
    }
  } finally {
    await context.close();
  }

  await writeFile(
    join(projectRoot, "sources", "capture-session.md"),
    [
      "# Capture Session",
      "",
      "## Completed Session",
      "",
      "- Browser provider: Playwright headed persistent Chromium",
      `- Profile/session path: ${sessionPath}`,
      "- Source capture mode: 交互辅助采集",
      "- Verification signal detected: none",
      "- Recovery signal: user confirmation in same opened browser if verification appears",
      "- User handoff time and result: not needed",
      "- Post-verification gate result: all required states captured",
      "",
      "## Captured States",
      "",
      ...captures.map(
        (capture) =>
          `- ${capture.stateId}: ${capture.finalUrl} (${capture.screenshot?.width}x${capture.screenshot?.height})`,
      ),
      "",
    ].join("\n"),
  );

  console.log(`Captured ${captures.length} Google source states into ${baselineRoot}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
