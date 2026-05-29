import { describe, expect, test } from "vitest";
import { buildMarkdownReport } from "../../evaluator/core/report";

describe("buildMarkdownReport", () => {
  test("prints capture mode and only the four agreed scoring dimensions", () => {
    const markdown = buildMarkdownReport({
      generatedAt: "2026-05-29T12:00:00+08:00",
      pages: [
        {
          pageId: "baidu",
          name: "百度首页",
          originalUrl: "https://www.baidu.com",
          replicaUrl: "http://127.0.0.1:5173/replica/baidu",
          sourceValidation: {
            status: "passed",
            canScore: true,
            finalUrl: "https://www.baidu.com/",
            issues: [],
            captureMode: "live",
          },
          score: {
            totalScore: 88.5,
            level: "基本一致",
            metrics: {
              functionality: 100,
              interaction: 90,
              visual: 80,
              accessibility: 90,
            },
          },
        },
      ],
    });

    expect(markdown).toContain("评估方式：实时原站采集评估");
    expect(markdown).toContain("| 功能一致性 | 100 |");
    expect(markdown).toContain("| 交互一致性 | 90 |");
    expect(markdown).toContain("| 视觉一致性 | 80 |");
    expect(markdown).toContain("| 可访问性一致性 | 90 |");
    expect(markdown).not.toContain("性能一致性");
    expect(markdown).not.toContain("响应式一致性");
  });

  test("prints screenshot baseline mode when source capture used fallback evidence", () => {
    const markdown = buildMarkdownReport({
      generatedAt: "2026-05-29T12:00:00+08:00",
      pages: [
        {
          pageId: "baidu",
          name: "百度首页",
          originalUrl: "https://www.baidu.com",
          replicaUrl: "http://127.0.0.1:5173/replica/baidu",
          sourceValidation: {
            status: "passed",
            canScore: true,
            finalUrl: "https://www.baidu.com/",
            issues: [
              {
                severity: "warning",
                code: "SOURCE_FALLBACK_SCREENSHOT",
                message: "已使用最近一次成功截图/DOM 基准降级评估",
              },
            ],
            captureMode: "baseline",
          },
          score: {
            totalScore: 88.5,
            level: "基本一致",
            metrics: {
              functionality: 100,
              interaction: 90,
              visual: 80,
              accessibility: 90,
            },
          },
        },
      ],
    });

    expect(markdown).toContain("评估方式：截图/DOM 基线降级评估");
  });

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
