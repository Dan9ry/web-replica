import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = "http://127.0.0.1:5173/replica/google-search";
const outDir = new URL(".", import.meta.url).pathname;

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: join(outDir, "local-initial.png"), fullPage: false });
  await page.fill("[data-search-input]", "tencent");
  await page.click("[data-search-submit]");
  await page.waitForSelector("[data-results-list]", { timeout: 3000 });
  await page.screenshot({ path: join(outDir, "local-results.png"), fullPage: false });
  const firstCount = await page.locator("[data-result-item]").count();
  const value = await page.locator("[data-search-input]").inputValue();

  await page.click("[data-page-next]");
  await page.waitForSelector("[data-current-page='2']", { timeout: 3000 });
  await page.screenshot({ path: join(outDir, "local-page-2.png"), fullPage: false });
  const url = page.url();
  const currentText = await page.locator("[data-pagination]").innerText();

  console.log(JSON.stringify({
    initialOpened: true,
    queryValue: value,
    firstPageResultCount: firstCount,
    pageTwoUrlIncludes: url.includes("page=2"),
    paginationText: currentText.replace(/\s+/g, " ").trim(),
    screenshots: [
      "projects/google-search/captures/local-initial.png",
      "projects/google-search/captures/local-results.png",
      "projects/google-search/captures/local-page-2.png"
    ]
  }, null, 2));
} finally {
  await browser.close();
}
