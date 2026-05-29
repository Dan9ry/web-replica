import { expect, test } from "@playwright/test";

test.describe("Baidu replica", () => {
  test("searches with button, paginates results, and returns to previous page", async ({
    page,
  }) => {
    await page.goto("/replica/baidu");

    const searchInput = page.getByRole("textbox", { name: "百度搜索" });
    await expect(searchInput).toBeVisible();
    await expect(page.getByRole("button", { name: "百度一下" })).toBeVisible();
    await expect(page.getByText("百度热搜")).toBeVisible();

    await searchInput.fill("微信支付");
    await page.getByRole("button", { name: "百度一下" }).click();

    await expect(page.getByTestId("result-summary")).toContainText("微信支付");
    await expect(page.getByRole("navigation", { name: "搜索分类" })).toContainText("网页");
    await expect(page.getByTestId("related-searches")).toContainText("怎么追回微信付款");
    await expect(page.getByTestId("result-sidebar")).toContainText("百度热搜");
    await expect(page.getByTestId("result-list")).toContainText("微信支付商户平台产品介绍");
    await expect(page.getByRole("button", { name: "第 1 页" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByRole("button", { name: "下一页" }).click();
    await expect(page.getByRole("button", { name: "第 2 页" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByTestId("result-list")).toContainText("微信支付接入流程");

    await page.getByRole("button", { name: "上一页" }).click();
    await expect(page.getByRole("button", { name: "第 1 页" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("supports enter search, empty validation, and hot list refresh", async ({
    page,
  }) => {
    await page.goto("/replica/baidu");

    await page.getByRole("button", { name: "百度一下" }).click();
    await expect(page.getByText("请输入搜索关键词")).toBeVisible();
    await expect(page.getByText("百度热搜")).toBeVisible();

    const firstHotItem = await page.getByTestId("hot-search-list").innerText();
    await page.getByRole("button", { name: "换一换" }).click();
    await expect(page.getByTestId("hot-search-list")).not.toHaveText(firstHotItem);

    const searchInput = page.getByRole("textbox", { name: "百度搜索" });
    await searchInput.fill("AI 工具");
    await searchInput.press("Enter");

    await expect(page.getByTestId("result-summary")).toContainText("AI 工具");
    await expect(page.getByTestId("result-list")).toBeVisible();
  });
});
