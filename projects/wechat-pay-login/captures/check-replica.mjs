import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });

try {
  await page.goto("http://127.0.0.1:5173/replica/wechat-pay-login");
  await page.click("[data-replica='login-button']");
  await page.getByText("请输入登录账号").waitFor({ timeout: 3000 });

  await page.fill("[data-replica='username-input']", "merchant@example.com");
  await page.fill("[data-replica='password-input']", "password123");
  await page.fill("[data-replica='captcha-input']", "J7NW");
  await page.getByRole("button", { name: "换一张" }).click();
  await page.fill("[data-replica='captcha-input']", "K6YM");
  await page.click("[data-replica='login-button']");
  await page.getByText("验证码错误，请重新输入").waitFor({ timeout: 3000 });
  await page.screenshot({
    path: "projects/wechat-pay-login/captures/replica-interaction.png",
    fullPage: false,
  });
} finally {
  await browser.close();
}

