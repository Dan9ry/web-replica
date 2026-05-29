import { describe, expect, test } from "vitest";
import { evaluateReplicaConsistency } from "../../evaluator/core/evaluationMetrics";
import type { StateCapture } from "../../evaluator/core/types";

function makeCapture(
  stateId: string,
  side: "original" | "replica",
  overrides: Partial<StateCapture> = {},
): StateCapture {
  return {
    stateId,
    side,
    viewport: "desktop",
    requestedUrl:
      side === "original"
        ? "https://www.baidu.com"
        : "http://127.0.0.1:5173/replica/baidu",
    finalUrl:
      side === "original"
        ? "https://www.baidu.com/"
        : "http://127.0.0.1:5173/replica/baidu",
    status: 200,
    title: side === "original" ? "百度一下，你就知道" : "Baidu Replica",
    bodyTextSample: "百度一下 百度热搜 搜索工具 网页 图片",
    screenshotPath: `reports/latest/assets/baidu/${stateId}/${side}-desktop.png`,
    screenshot: { width: 1365, height: 768, blank: false },
    selectors: {
      search: { count: 1, visibleCount: 1 },
      button: { count: 1, visibleCount: 1 },
    },
    domProfile: {
      landmarks: { nav: 1, main: 1, form: 1, button: 4, link: 12, input: 1 },
      textSample: "百度一下 百度热搜 搜索工具 网页 图片",
      styles: {
        search: {
          fontSize: "16px",
          color: "rgb(34, 34, 34)",
          backgroundColor: "rgb(255, 255, 255)",
          borderRadius: "10px",
          width: "800px",
          height: "88px",
        },
      },
    },
    metrics: {
      loadTimeMs: 500,
      screenshotDiffRatio: 0.08,
      ssim: 0.91,
    },
    ...overrides,
  };
}

describe("evaluateReplicaConsistency", () => {
  test("builds non-zero weighted metrics from matched state captures", () => {
    const result = evaluateReplicaConsistency({
      originalCaptures: [makeCapture("home", "original"), makeCapture("results", "original")],
      replicaCaptures: [makeCapture("home", "replica"), makeCapture("results", "replica")],
      interactionResults: [
        { stateId: "home", name: "空输入提示", passed: true },
        { stateId: "results", name: "结果页分页", passed: true },
      ],
    });

    expect(result.metrics.visual).toBeGreaterThan(80);
    expect(result.metrics.functionality).toBe(100);
    expect(result.metrics.interaction).toBe(100);
    expect(result.metrics).not.toHaveProperty("performance");
    expect(result.metrics).not.toHaveProperty("responsive");
    expect(result.metrics).not.toHaveProperty("accessibility");
    expect(result.score.totalScore).toBeGreaterThan(80);
    expect(result.issues.map((issue) => issue.code)).not.toContain(
      "REPLICA_METRICS_NOT_IMPLEMENTED",
    );
  });

  test("reports missing replica states and penalizes functionality", () => {
    const result = evaluateReplicaConsistency({
      originalCaptures: [makeCapture("home", "original"), makeCapture("results", "original")],
      replicaCaptures: [makeCapture("home", "replica")],
      interactionResults: [],
    });

    expect(result.metrics.functionality).toBeLessThan(100);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "MISSING_REPLICA_STATE",
      }),
    );
  });

  test("adds actionable suggestions for low scoring dimensions", () => {
    const result = evaluateReplicaConsistency({
      originalCaptures: [
        makeCapture("home", "original"),
        makeCapture("results", "original"),
      ],
      replicaCaptures: [
        makeCapture("home", "replica", {
          metrics: { screenshotDiffRatio: 0.52, ssim: 0.45 },
          domProfile: {
            landmarks: { nav: 0, main: 0, form: 0, button: 1, link: 2, input: 1 },
            textSample: "百度一下",
            styles: {},
          },
        }),
        makeCapture("results", "replica", {
          metrics: { screenshotDiffRatio: 0.48, ssim: 0.5 },
          domProfile: {
            landmarks: { nav: 0, main: 0, form: 0, button: 1, link: 2, input: 1 },
            textSample: "微信支付",
            styles: {},
          },
        }),
      ],
      interactionResults: [
        { stateId: "home", name: "首页状态采集", passed: true },
        { stateId: "results", name: "结果页采集", passed: false },
      ],
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "LOW_VISUAL_SCORE",
        message: expect.stringContaining("视觉差异图"),
      }),
    );
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "LOW_INTERACTION_SCORE",
        message: expect.stringContaining("复刻页交互"),
      }),
    );
  });
});
