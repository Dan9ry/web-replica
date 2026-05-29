import { expect, test } from "@playwright/test";

test("home page describes the clean replica workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "网页复刻与一致性评估基础环境" })).toBeVisible();
  await expect(page.getByText("使用 skill 创建复刻 project")).toBeVisible();
});

test("baidu replica supports search and pagination", async ({ page }) => {
  await page.goto("/replica/baidu");
  await expect(page.locator("#kw")).toBeVisible();
  await page.locator("#kw").fill("网页复刻");
  await page.locator("#su").click();
  await expect(page.locator("#content_left")).toContainText("网页复刻");
  await page.getByRole("button", { name: "2" }).click();
  await expect(page.locator("#page")).toContainText("2");
  await expect(page.locator("#content_left")).toContainText("一致性评估");
});
