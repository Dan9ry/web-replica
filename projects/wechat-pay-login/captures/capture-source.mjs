import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const stateDir = join(projectRoot, "baselines", "initial");
const captureSessionPath = join(projectRoot, "sources", "capture-session.md");
const blockersPath = join(projectRoot, "logs", "blockers.md");
const targetUrl = "https://pay.weixin.qq.com/index.php/core/home/login";

const captureMayNeedVerification = true;
const headless = false;

if (captureMayNeedVerification && headless !== false) {
  throw new Error("Verification handoff requires a visible headed browser window.");
}

function nowIso() {
  return new Date().toISOString();
}

async function visibleCount(page, selectors) {
  let total = 0;
  for (const selector of selectors) {
    const locator = page.locator(selector);
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      if (await locator.nth(index).isVisible().catch(() => false)) {
        total += 1;
      }
    }
  }
  return total;
}

async function detectRequiredInputs(page) {
  const visibleInputs = await page.locator("input:visible").evaluateAll((inputs) =>
    inputs.map((input) => ({
      type: input.getAttribute("type") || "text",
      placeholder: input.getAttribute("placeholder") || "",
      name: input.getAttribute("name") || "",
      id: input.getAttribute("id") || "",
      valueLength: input.value?.length || 0,
      rect: (() => {
        const rect = input.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })(),
    })),
  );

  const hasPassword = visibleInputs.some((input) => input.type.toLowerCase() === "password");
  const hasCaptcha = visibleInputs.some((input) =>
    /验证码|captcha|verify|code/i.test(
      `${input.placeholder} ${input.name} ${input.id}`,
    ),
  );
  const hasUserLike = visibleInputs.some((input) =>
    /账号|账户|用户名|邮箱|手机号|login|user|account|email|mobile/i.test(
      `${input.placeholder} ${input.name} ${input.id}`,
    ),
  );

  return { visibleInputs, hasPassword, hasCaptcha, hasUserLike };
}

async function detectVerification(page) {
  const url = page.url();
  const title = await page.title().catch(() => "");
  const text = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  const lower = `${url}\n${title}\n${text}`.toLowerCase();
  const verificationSignals = [
    "安全验证",
    "访问验证",
    "智能验证",
    "环境异常",
    "滑块",
    "人机",
    "captcha challenge",
    "security verification",
    "verify you are human",
    "access denied",
  ];

  return verificationSignals.some((signal) => lower.includes(signal.toLowerCase()));
}

async function tryQrModeRecovery(page) {
  const candidates = [
    { kind: "locator", locator: page.getByText(/账号登录|账户登录|帐号登录|使用账号|使用账户|密码登录/).first() },
    { kind: "locator", locator: page.locator("a,button,[role='button']").filter({ hasText: /登录/ }).first() },
    { kind: "locator", locator: page.locator(".login-switch,.switch-login,.qrcode,.corner,.icon,[class*='corner'],[class*='switch']").first() },
    { kind: "point", point: { x: 1205, y: 181 }, label: "qr-card-top-right-fold" },
    { kind: "point", point: { x: 1188, y: 198 }, label: "qr-card-fold-inner" },
  ];

  const attempts = [];
  for (const candidate of candidates) {
    if (candidate.kind === "point") {
      await page.mouse.click(candidate.point.x, candidate.point.y);
      await page.waitForTimeout(1000);
      const inputs = await detectRequiredInputs(page);
      attempts.push({
        candidate: candidate.label,
        clicked: true,
        point: candidate.point,
        result: inputs,
      });

      if (inputs.hasPassword && (inputs.hasCaptcha || inputs.visibleInputs.length >= 3)) {
        return { recovered: true, attempts };
      }
      continue;
    }

    const box = await candidate.locator.boundingBox().catch(() => null);
    if (!box) {
      attempts.push({ candidate: "unavailable", clicked: false, result: "no visible box" });
      continue;
    }

    await candidate.locator.click({ timeout: 2000 }).catch(() => null);
    await page.waitForTimeout(800);
    const inputs = await detectRequiredInputs(page);
    attempts.push({
      candidate: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
      clicked: true,
      result: inputs,
    });

    if (inputs.hasPassword && (inputs.hasCaptcha || inputs.visibleInputs.length >= 3)) {
      return { recovered: true, attempts };
    }
  }

  return { recovered: false, attempts };
}

async function captureScrollViewport(page, outputPath, scrollY) {
  await page.evaluate((y) => window.scrollTo(0, y), scrollY);
  await page.waitForTimeout(250);
  await page.screenshot({ path: outputPath, fullPage: false });
}

async function collectVisibleDomSummary(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };

    const summarizeElement = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        text: element.innerText?.trim().slice(0, 120) || "",
        type: element.getAttribute("type") || "",
        placeholder: element.getAttribute("placeholder") || "",
        ariaLabel: element.getAttribute("aria-label") || "",
        className: String(element.className || "").slice(0, 160),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        style: {
          fontSize: style.fontSize,
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          borderRadius: style.borderRadius,
          lineHeight: style.lineHeight,
          fontWeight: style.fontWeight,
        },
      };
    };

    const controls = Array.from(
      document.querySelectorAll("input,button,a,[role='button'],[role='textbox']"),
    )
      .filter(visible)
      .map(summarizeElement);

    const body = document.body;
    const bodyStyle = window.getComputedStyle(body);

    return {
      url: window.location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollHeight: document.documentElement.scrollHeight,
      },
      bodyTextSample: body.innerText.trim().slice(0, 1600),
      bodyStyle: {
        fontSize: bodyStyle.fontSize,
        color: bodyStyle.color,
        backgroundColor: bodyStyle.backgroundColor,
        fontFamily: bodyStyle.fontFamily,
      },
      visibleControls: controls,
    };
  });
}

await mkdir(stateDir, { recursive: true });
await writeFile(
  captureSessionPath,
  [
    "# Capture Session",
    "",
    "- Browser provider: Playwright headed",
    "- Profile/session path: ephemeral Playwright browser context",
    "- Locked session id/provider: playwright-headed / initial",
    `- Target URL: ${targetUrl}`,
    "- Resume signal: projects/wechat-pay-login/captures/verification-resume.json",
    "- Note: user must complete verification in the already-opened browser window/tab if verification appears",
    `- Started: ${nowIso()}`,
    "",
  ].join("\n"),
);

const browser = await chromium.launch({ headless, channel: undefined });
const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });

try {
  const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(1500);

  if (await detectVerification(page)) {
    const blockedShot = join(stateDir, "blocked-verification.png");
    await page.screenshot({ path: blockedShot, fullPage: true });
    await writeFile(
      blockersPath,
      [
        "# Blockers",
        "",
        `- ${nowIso()} Source capture blocked by verification/security page at ${page.url()}.`,
        `- Screenshot: ${blockedShot}`,
        "- The same Playwright headed session would be required for user handoff.",
        "",
      ].join("\n"),
    );
    throw new Error("Verification/security page detected during source capture.");
  }

  let inputState = await detectRequiredInputs(page);
  const qrDominates = await visibleCount(page, ["canvas", "img[src*='qrcode']", ".qrcode", "[class*='qrcode']"]);

  let recovery = { recovered: false, attempts: [] };
  if (!(inputState.hasPassword && (inputState.hasCaptcha || inputState.visibleInputs.length >= 3)) && qrDominates > 0) {
    await page.screenshot({ path: join(stateDir, "qr-mode-before-recovery.png"), fullPage: true });
    recovery = await tryQrModeRecovery(page);
    inputState = await detectRequiredInputs(page);
  }

  const requiredVisible =
    inputState.hasPassword && (inputState.hasCaptcha || inputState.visibleInputs.length >= 3);

  if (!requiredVisible) {
    await page.screenshot({ path: join(stateDir, "missing-required-inputs.png"), fullPage: true });
    await writeFile(
      blockersPath,
      [
        "# Blockers",
        "",
        `- ${nowIso()} Required username/password/captcha form was not verified at ${page.url()}.`,
        `- Input detection: ${JSON.stringify(inputState, null, 2)}`,
        `- QR recovery attempts: ${JSON.stringify(recovery, null, 2)}`,
        "",
      ].join("\n"),
    );
    throw new Error("Required login form inputs were not visible after limited recovery.");
  }

  await page.screenshot({ path: join(stateDir, "original-desktop.png"), fullPage: true });

  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  await captureScrollViewport(page, join(stateDir, "original-top.png"), 0);
  await captureScrollViewport(
    page,
    join(stateDir, "original-middle.png"),
    Math.max(0, Math.round((scrollHeight - viewportHeight) / 2)),
  );
  await captureScrollViewport(
    page,
    join(stateDir, "original-bottom.png"),
    Math.max(0, scrollHeight - viewportHeight),
  );

  const domSummary = await collectVisibleDomSummary(page);
  await writeFile(join(stateDir, "original-dom.json"), JSON.stringify({
    requestedUrl: targetUrl,
    finalUrl: page.url(),
    status: response?.status() ?? null,
    capturedAt: nowIso(),
    inputState,
    qrRecovery: recovery,
    ...domSummary,
  }, null, 2));

  await writeFile(
    join(stateDir, "capture-notes.md"),
    [
      "# Capture Notes: Initial Login Form",
      "",
      "- head/top captured: yes (`original-top.png`)",
      "- middle captured: yes (`original-middle.png`)",
      "- footer/bottom captured: yes (`original-bottom.png`)",
      "- browser/session used: Playwright headed, ephemeral context",
      `- requested URL: ${targetUrl}`,
      `- final URL: ${page.url()}`,
      `- HTTP status: ${response?.status() ?? "unknown"}`,
      "- sensitive capture rule: only visible UI text, visible controls, screenshots, and computed style summaries were saved; cookies/storage/hidden fields were not collected.",
      `- visible input detection: ${JSON.stringify(inputState)}`,
      `- QR recovery attempted: ${recovery.attempts.length > 0 ? "yes" : "no"}`,
      "",
    ].join("\n"),
  );

  await writeFile(
    captureSessionPath,
    [
      "# Capture Session",
      "",
      "- Browser provider: Playwright headed",
      "- Profile/session path: ephemeral Playwright browser context",
      "- Locked session id/provider: playwright-headed / initial",
      `- Target URL: ${targetUrl}`,
      `- Current/final URL: ${page.url()}`,
      "- Verification signal detected: no",
      "- Recovery signal file: projects/wechat-pay-login/captures/verification-resume.json",
      "- Post-verification gate result: not needed",
      `- Completed: ${nowIso()}`,
      "",
    ].join("\n"),
  );
} finally {
  await browser.close();
}
