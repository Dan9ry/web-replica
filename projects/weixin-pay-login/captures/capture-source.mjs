import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const baselineRoot = join(projectRoot, "baselines");
const sessionPath = join(__dirname, "weixin-pay-playwright-profile");
const sourceUrl = "https://pay.weixin.qq.com/index.php/core/home/login";
const viewport = { width: 1365, height: 768 };

const states = [
  {
    id: "login-initial",
    name: "Login form initial state",
    trigger: async () => undefined,
  },
  {
    id: "login-validation",
    name: "Login button validation state",
    trigger: async (page) => {
      await page.mouse.click(1082, 438);
      await page.waitForTimeout(1000);
    },
  },
];

function blockerSignals(text, title, url) {
  const haystack = `${title}\n${url}\n${text}`.toLowerCase();
  return [
    "captcha",
    "安全验证",
    "access denied",
    "forbidden",
    "error",
    "访问受限",
    "网络环境存在风险",
  ].filter((signal) => haystack.includes(signal) && !haystack.includes("验证码"));
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

    const inputs = Array.from(document.querySelectorAll("input")).map((input) => ({
      type: input.getAttribute("type"),
      name: input.getAttribute("name"),
      placeholder: input.getAttribute("placeholder"),
      valueLength: input.value.length,
      visibleText: input.getAttribute("aria-label") || input.getAttribute("title"),
    }));

    return {
      landmarks: {
        nav: count("nav,[role='navigation']"),
        main: count("main,[role='main']"),
        form: count("form,[role='search'],[role='form']"),
        button: count("button,[role='button'],input[type='submit'],a.btn,a.button"),
        link: count("a,[role='link']"),
        input: count("input,textarea,[role='textbox']"),
        list: count("ul,ol,[role='list']"),
        listitem: count("li,[role='listitem']"),
      },
      textSample: (document.body.innerText || "").slice(0, 4000),
      styles,
      inputs,
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

  for (const position of positions) {
    await page.evaluate((y) => window.scrollTo(0, y), position.y);
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(stateDir, `original-${position.name}.png`), fullPage: false });
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(stateDir, "original-desktop.png"), fullPage: false });

  return { scrollHeight, maxScroll };
}

async function captureState(context, state) {
  const page = await context.newPage();
  const stateDir = join(baselineRoot, state.id);
  await mkdir(stateDir, { recursive: true });

  const response = await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 9000 }).catch(() => undefined);
  await page.waitForTimeout(1000);
  await page.mouse.click(1218, 193);
  await page.waitForTimeout(1000);
  await state.trigger(page);

  const title = await page.title();
  const finalUrl = page.url();
  const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  const signals = blockerSignals(bodyText, title, finalUrl);
  if (signals.length > 0) {
    throw new Error(`Access or verification blocker detected for ${state.id}: ${signals.join(", ")} at ${finalUrl}`);
  }

  if (!/账号密码登录|登录账号|登录密码|验证码|登录/.test(bodyText)) {
    throw new Error(`Required login form text was not found for ${state.id}. Final URL: ${finalUrl}`);
  }

  const selectors = [
    "body",
    "form",
    "input",
    "input[placeholder='登录账号']",
    "input[placeholder='登录密码']",
    "input[placeholder='验证码']",
    "input[type='text'],input:not([type]),input[type='tel']",
    "input[type='password']",
    "input[name*='code'],input[placeholder*='验证码'],input[placeholder*='校验']",
    "button,input[type='submit'],a",
    "img",
  ];
  const segments = await captureSegments(page, stateDir);
  const primaryImage = join(stateDir, "original-desktop.png");
  const capture = {
    stateId: state.id,
    side: "original",
    viewport: "desktop",
    requestedUrl: sourceUrl,
    finalUrl,
    status: response?.status() ?? null,
    title,
    bodyTextSample: bodyText.slice(0, 4000),
    screenshotPath: primaryImage,
    screenshot: await screenshotMetadata(primaryImage),
    selectors: await selectorSummary(page, selectors),
    domProfile: await domProfile(page, selectors),
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
      `- Browser/session used: Playwright headed persistent Chromium (${sessionPath})`,
      `- Requested URL: ${sourceUrl}`,
      `- Final URL: ${finalUrl}`,
      `- HTTP status: ${capture.status}`,
      `- Title: ${title}`,
      "- Head/top captured: yes (`original-top.png`)",
      "- Middle captured: yes (`original-middle.png`)",
      "- Footer/bottom captured: yes (`original-bottom.png`)",
      `- Scroll height: ${segments.scrollHeight}`,
      `- Max scroll captured: ${segments.maxScroll}`,
      "- Verification/access blocker signals: none",
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
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
  });

  const captures = [];
  try {
    for (const state of states) {
      captures.push(await captureState(context, state));
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
      ...captures.map((capture) => `- ${capture.stateId}: ${capture.finalUrl} (${capture.screenshot?.width}x${capture.screenshot?.height})`),
      "",
    ].join("\n"),
  );

  console.log(`Captured ${captures.length} Weixin Pay source states into ${baselineRoot}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
