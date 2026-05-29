import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, "..", "evaluation", "latest", "manual-check");
const baseUrl = "http://127.0.0.1:5173/replica/google-search";

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });

  await page.goto(baseUrl);
  await expect(page.getByRole("textbox", { name: "Search" })).toBeVisible();
  await expect(page.locator("[aria-label='Google']")).toBeVisible();
  await page.screenshot({ path: join(outputDir, "home.png"), fullPage: false });

  await page.getByRole("textbox", { name: "Search" }).fill("tencent");
  await page.getByRole("button", { name: "Google 検索" }).click();
  await expect(page).toHaveURL(/q=tencent/);
  await expect(
    page.getByLabel("Search results").getByRole("link", { name: "Tencent Japan" }),
  ).toBeVisible();
  await page.screenshot({ path: join(outputDir, "results-page-1.png"), fullPage: false });

  await page.getByRole("button", { name: "次へ" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByLabel("Search results").getByRole("link", { name: "Tencent Games" }),
  ).toBeVisible();
  await page.screenshot({ path: join(outputDir, "results-page-2.png"), fullPage: false });

  await page.goto(baseUrl);
  await page.getByRole("textbox", { name: "Search" }).fill("tencent games");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/q=tencent\+games/);
  await expect(page.locator("#search")).toBeVisible();

  await browser.close();
  console.log(`Manual interaction screenshots saved to ${outputDir}`);
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
