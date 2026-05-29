import { describe, expect, test } from "vitest";
import {
  buildSearchUrl,
  getResultPage,
  hasSearchQuery,
  normalizeSearchQuery,
} from "../../projects/google-search/page/utils/searchState";

describe("google search replica state helpers", () => {
  test("normalizes query text for local search", () => {
    expect(normalizeSearchQuery("  Tencent   cloud  ")).toBe("Tencent cloud");
    expect(hasSearchQuery("   ")).toBe(false);
    expect(hasSearchQuery("tencent")).toBe(true);
  });

  test("builds result URLs and clamps pagination to supported pages", () => {
    expect(buildSearchUrl("tencent", 1)).toBe("/replica/google-search?q=tencent");
    expect(buildSearchUrl("tencent games", 2)).toBe(
      "/replica/google-search?q=tencent+games&page=2",
    );
    expect(getResultPage(new URLSearchParams("q=tencent&page=7"))).toBe(2);
    expect(getResultPage(new URLSearchParams("q=tencent&page=0"))).toBe(1);
  });
});
