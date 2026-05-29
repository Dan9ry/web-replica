import { expect, test } from "@playwright/test";

test("home page describes the clean replica workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "网页复刻与一致性评估基础环境" })).toBeVisible();
  await expect(page.getByText("使用 skill 创建复刻 project")).toBeVisible();
});
