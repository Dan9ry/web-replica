import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.REPLICA_URL ?? "http://127.0.0.1:5173/replica/gitee-signup";
const outDir = path.resolve("projects/gitee-signup/evaluation/latest/manual-check");

async function expectVisibleText(page, text) {
  const locator = page.getByText(text, { exact: false }).first();
  await locator.waitFor({ state: "visible", timeout: 5000 });
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await expectVisibleText(page, "注册");
  await page.getByPlaceholder("姓名").waitFor({ state: "visible" });
  await page.getByPlaceholder("个人空间地址").waitFor({ state: "visible" });
  await page.getByPlaceholder("请输入手机号码").waitFor({ state: "visible" });
  await page.getByPlaceholder("密码不少于8位").waitFor({ state: "visible" });
  await page.screenshot({ path: path.join(outDir, "replica-initial.png"), fullPage: true });

  await page.getByPlaceholder("姓名").focus();
  await page.getByPlaceholder("个人空间地址").focus();
  await expectVisibleText(page, "姓名为必填项");
  await page.screenshot({ path: path.join(outDir, "replica-blur-required.png"), fullPage: true });

  await page.getByRole("button", { name: "立即注册" }).click();
  await expectVisibleText(page, "请填写此字段。");
  await expectVisibleText(page, "个人空间地址为必填项");
  await expectVisibleText(page, "手机号码为必填项");
  await expectVisibleText(page, "密码长度不得低于8个字符");
  await page.screenshot({ path: path.join(outDir, "replica-submit-validation.png"), fullPage: true });

  await browser.close();
  console.log(`Replica verification passed for ${baseUrl}`);
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
