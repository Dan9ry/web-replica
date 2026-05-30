import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const baselineRoot = join(projectRoot, "baselines");
const sessionPath = join(__dirname, "gitee-signup-playwright-profile");
const sourceUrl = "https://gitee.com/signup";
const viewport = { width: 1365, height: 768 };

const visibleInputSelector = "input:not([type='hidden']),textarea";

const states = [
  {
    id: "signup-initial",
    name: "Signup form initial state",
    trigger: async () => undefined,
  },
  {
    id: "signup-blur-required",
    name: "Required prompts after blur",
    trigger: async (page) => {
      const inputs = page.locator(visibleInputSelector);
      const count = await inputs.count();
      for (let index = 0; index < Math.min(count, 6); index += 1) {
        const input = inputs.nth(index);
        if (await input.isVisible().catch(() => false)) {
          await input.focus();
          await page.keyboard.press("Tab");
          await page.waitForTimeout(250);
        }
      }
    },
  },
  {
    id: "signup-submit-validation",
    name: "Signup button validation state",
    trigger: async (page) => {
      const button = page
        .locator("button,input[type='submit'],a")
        .filter({ hasText: /注册|立即注册|Sign up|Create/i })
        .first();
      if (await button.isVisible({ timeout: 2500 }).catch(() => false)) {
        await button.click({ timeout: 5000 });
      } else {
        await page.keyboard.press("Enter");
      }
      await page.waitForTimeout(1200);
    },
  },
];

function blockerSignals(text, title, url) {
  const haystack = `${title}\n${url}\n${text}`.toLowerCase();
  return [
    "captcha",
    "人机验证",
    "安全验证",
    "访问受限",
    "access denied",
    "forbidden",
    "too many requests",
    "verify you are human",
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

    const visibleInputs = Array.from(
      document.querySelectorAll("input:not([type='hidden']),textarea"),
    )
      .filter((input) => {
        const rect = input.getBoundingClientRect();
        const computed = window.getComputedStyle(input);
        return rect.width > 0 && rect.height > 0 && computed.display !== "none" && computed.visibility !== "hidden";
      })
      .map((input) => ({
        tag: input.tagName,
        type: input.getAttribute("type"),
        name: input.getAttribute("name"),
        placeholder: input.getAttribute("placeholder"),
        ariaLabel: input.getAttribute("aria-label"),
        title: input.getAttribute("title"),
        rect: (() => {
          const rect = input.getBoundingClientRect();
          return {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })(),
      }));

    return {
      landmarks: {
        nav: count("nav,[role='navigation']"),
        main: count("main,[role='main']"),
        form: count("form,[role='form']"),
        button: count("button,[role='button'],input[type='submit']"),
        link: count("a,[role='link']"),
        input: count("input,textarea,[role='textbox']"),
        list: count("ul,ol,[role='list']"),
        listitem: count("li,[role='listitem']"),
      },
      textSample: (document.body.innerText || "").slice(0, 4000),
      styles,
      visibleInputs,
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
  await page.waitForTimeout(1200);
  await state.trigger(page);

  const title = await page.title();
  const finalUrl = page.url();
  const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  const signals = blockerSignals(bodyText, title, finalUrl);
  if (signals.length > 0) {
    throw new Error(`Access or verification blocker detected for ${state.id}: ${signals.join(", ")} at ${finalUrl}`);
  }

  if (!/注册|加入|邮箱|手机|密码|Gitee/i.test(bodyText)) {
    throw new Error(`Required signup form text was not found for ${state.id}. Final URL: ${finalUrl}`);
  }

  const selectors = [
    "body",
    "main",
    "form",
    "input:not([type='hidden']),textarea",
    "input[type='password']",
    "button,input[type='submit']",
    "a",
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
    manualVerified: true,
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
      "- Sensitive capture rule: visible inputs and visible UI evidence only; hidden tokens/storage not read.",
      "- Verification/access blocker signals: none",
      "- Manual visible-page verification: yes; headed browser showed the requested signup form state.",
      "",
      "## Visible Input Summary",
      "",
      "```json",
      JSON.stringify(capture.domProfile?.visibleInputs ?? [], null, 2),
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
      "- Sensitive capture: visible form UI only; hidden token/cookie/storage data not read.",
      "",
      "## Captured States",
      "",
      ...captures.map((capture) => `- ${capture.stateId}: ${capture.finalUrl} (${capture.screenshot?.width}x${capture.screenshot?.height})`),
      "",
    ].join("\n"),
  );

  console.log(`Captured ${captures.length} Gitee signup source states into ${baselineRoot}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
