import { describe, expect, test } from "vitest";
import { buildCaptureGateMessage, shouldInterruptEvaluation } from "../../evaluator/core/captureGate";
import type { PageEvaluationResult } from "../../evaluator/core/types";

const failedPage: PageEvaluationResult = {
  pageId: "baidu",
  name: "Baidu Home",
  originalUrl: "https://www.baidu.com",
  replicaUrl: "http://127.0.0.1:5173/replica/baidu",
  sourceValidation: {
    status: "failed",
    canScore: false,
    finalUrl: "https://wappass.baidu.com/static/captcha/tuxing_v2.html",
    issues: [
      {
        severity: "error",
        code: "SUSPICIOUS_PAGE",
        message: "原网页疑似错误页、拦截页、验证码页或访问受限页面。",
      },
    ],
    stateResults: [
      {
        stateId: "results",
        name: "搜索结果页",
        status: "failed",
        canScore: false,
        finalUrl: "https://wappass.baidu.com/static/captcha/tuxing_v2.html",
        issues: [
          {
            severity: "error",
            code: "SUSPICIOUS_PAGE",
            message: "原网页疑似错误页、拦截页、验证码页或访问受限页面。",
          },
        ],
      },
    ],
  },
};

describe("capture gate", () => {
  test("interrupts evaluation when any required original state fails", () => {
    expect(shouldInterruptEvaluation([failedPage])).toBe(true);
  });

  test("asks the user to resolve security verification before rerunning", () => {
    const message = buildCaptureGateMessage([failedPage]);

    expect(message).toContain("评估已中断");
    expect(message).toContain("Baidu Home");
    expect(message).toContain("results");
    expect(message).toContain("请先在真实浏览器中完成安全验证/AI 校验/验证码");
    expect(message).toContain("npm run eval");
  });
});
