import { expect, test } from "@playwright/test";

test("home page links to replica scaffolds", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Baidu Replica/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /WeChat Pay Login/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Third Page/i })).toBeVisible();
});

