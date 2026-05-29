import { describe, expect, test } from "vitest";
import { buildHtmlReport, buildMarkdownReport } from "../../evaluator/core/report";
import { buildSixDimensionalReport } from "../../evaluator/core/reportModel";

describe("buildMarkdownReport", () => {
  test("prints capture mode and the six scoring dimensions", () => {
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
              structure: 85,
              content: 92,
              engineering: 88,
            },
          },
        },
      ],
    });

    expect(markdown).toContain("评估方式：实时原站采集评估");
    expect(markdown).toContain("评估体系：六维评估体系 v2.0");
    expect(markdown).toContain("| 功能正确性 | 25% | 100 |");
    expect(markdown).toContain("| 交互流程一致性 | 20% | 90 |");
    expect(markdown).toContain("| 视觉一致性 | 25% | 80 |");
    expect(markdown).toContain("| 结构语义一致性 | 10% | 85 |");
    expect(markdown).toContain("| 内容数据一致性 | 10% | 92 |");
    expect(markdown).toContain("| 工程可维护性 | 10% | 88 |");
    expect(markdown).toContain("## 3. 高优先级问题");
    expect(markdown).toContain("## 7. 证据中心");
    expect(markdown).not.toContain("可访问性一致性");
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
              structure: 85,
              content: 92,
              engineering: 88,
            },
          },
        },
      ],
    });

    expect(markdown).toContain("评估方式：Phase 3 截图/DOM 基线评估");
  });

  test("builds structured six-dimensional summary and HTML dashboard", () => {
    const richReport = buildSixDimensionalReport({
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
            captureMode: "baseline",
          },
          score: {
            totalScore: 91,
            level: "高一致",
            metrics: {
              functionality: 95,
              interaction: 90,
              visual: 88,
              structure: 86,
              content: 94,
              engineering: 90,
            },
          },
          artifacts: {
            visualDiffs: ["projects/baidu/evaluation/latest/assets/baidu/home/diff-desktop.png"],
          },
        },
      ],
    });
    const html = buildHtmlReport(richReport);

    expect(richReport.schemaVersion).toBe("2.0");
    expect(richReport.summary.dimensions.functionality.weightedContribution).toBe(23.8);
    expect(richReport.artifacts.byDimension.visual).toContain("projects/baidu/evaluation/latest/assets/baidu/home/diff-desktop.png");
    expect(html).toContain("页面 × 六维矩阵");
    expect(html).toContain("证据中心");
  });

  test("marks hard gate failures while keeping diagnostic scores", () => {
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

    expect(markdown).toContain("硬门禁失败");
    expect(markdown).toContain("缺失关键元素 #kw");
    expect(markdown).toContain("总分：0 / 100");
    expect(markdown).toContain("总分仅供定位问题，不作为通过依据");
  });
});
