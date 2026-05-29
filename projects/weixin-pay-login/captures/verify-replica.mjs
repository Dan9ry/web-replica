import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, "..", "evaluation", "latest", "manual-check");
const baseUrl = "http://127.0.0.1:5173/replica/weixin-pay-login";

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });

  await page.goto(baseUrl);
  await expect(page.getByRole("heading", { name: "账号密码登录" })).toBeVisible();
  await expect(page.getByPlaceholder("登录账号")).toBeVisible();
  await expect(page.getByPlaceholder("登录密码")).toBeVisible();
  await expect(page.getByPlaceholder("验证码")).toBeVisible();
  await page.screenshot({ path: join(outputDir, "login-initial.png"), fullPage: false });

  await page.getByRole("button", { name: "登录" }).click();
  await expect(page.getByText("请输入账号和密码")).toBeVisible();
  await page.screenshot({ path: join(outputDir, "login-validation.png"), fullPage: false });

  await page.getByText("换一张").click();
  await expect(page.getByRole("button", { name: "验证码图片" })).toBeVisible();

  await browser.close();
  console.log(`Manual interaction screenshots saved to ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
