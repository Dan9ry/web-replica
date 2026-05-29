import { describe, expect, test } from "vitest";
import { validateTargetStateCaptures } from "../../evaluator/core/stateValidation";
import type { PageTarget, StateCapture } from "../../evaluator/core/types";

const target: PageTarget = {
  id: "baidu",
  name: "百度首页",
  originalUrl: "https://www.baidu.com",
  replicaUrl: "http://127.0.0.1:5173/replica/baidu",
  criticalSelectors: ["#chat-textarea", "#chat-submit-button"],
  expectedTitleIncludes: ["百度"],
  expectedUrlIncludes: ["baidu.com"],
  expectedTextIncludes: ["百度一下"],
  viewports: [{ name: "desktop", width: 1365, height: 768 }],
  states: [
    {
      id: "home",
      name: "首页初始态",
      criticalSelectors: ["#chat-textarea", "#chat-submit-button"],
      expectedTextIncludes: ["百度一下"],
    },
    {
      id: "results",
      name: "搜索结果页",
      criticalSelectors: ["#content_left"],
      expectedTextIncludes: ["搜索工具"],
    },
  ],
};

function captureFor(stateId: string): StateCapture {
  return {
    stateId,
    side: "original",
    viewport: "desktop",
    requestedUrl: "https://www.baidu.com",
    finalUrl: "https://www.baidu.com/",
    status: 200,
    title: "百度一下，你就知道",
    bodyTextSample: "百度一下 搜索工具",
    screenshotPath: `reports/latest/assets/baidu/${stateId}/original-desktop.png`,
    screenshot: { width: 1365, height: 768, blank: false },
    selectors: {
      "#chat-textarea": { count: 1, visibleCount: 1 },
      "#chat-submit-button": { count: 1, visibleCount: 1 },
      "#content_left": { count: 1, visibleCount: 1 },
    },
    domProfile: {
      landmarks: { nav: 1, main: 1, form: 1, button: 2, link: 12, input: 1 },
      textSample: "百度一下 搜索工具",
      styles: {},
    },
  };
}

describe("validateTargetStateCaptures", () => {
  test("passes only when every required original state is captured", () => {
    const result = validateTargetStateCaptures(target, [
      captureFor("home"),
      captureFor("results"),
    ]);

    expect(result.canScore).toBe(true);
    expect(result.status).toBe("passed");
    expect(result.stateResults.map((state) => state.stateId)).toEqual([
      "home",
      "results",
    ]);
  });

  test("fails closed when a required original state is missing", () => {
    const result = validateTargetStateCaptures(target, [captureFor("home")]);

    expect(result.canScore).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "MISSING_STATE_CAPTURE",
        message: expect.stringContaining("results"),
      }),
    );
  });
});
