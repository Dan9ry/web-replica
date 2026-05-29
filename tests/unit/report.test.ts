import { describe, expect, test } from "vitest";
import { buildMarkdownReport } from "../../evaluator/core/report";

describe("buildMarkdownReport", () => {
  test("does not print a total score when source validation failed", () => {
    const markdown = buildMarkdownReport({
      generatedAt: "2026-05-29T12:00:00+08:00",
      pages: [
        {
          pageId: "baidu",
          name: "百度首页",
          originalUrl: "https://www.baidu.com",
          replicaUrl: "http://127.0.0.1:5173/replica/baidu",
          sourceValidation: {
            status: "failed",
            canScore: false,
            finalUrl: "https://www.baidu.com/error",
            issues: [
              {
                severity: "error",
                code: "MISSING_CRITICAL_SELECTOR",
                message: "缺失关键元素 #kw",
              },
            ],
          },
        },
      ],
    });

    expect(markdown).toContain("原网页采集失败");
    expect(markdown).toContain("缺失关键元素 #kw");
    expect(markdown).not.toContain("总分：");
  });
});

