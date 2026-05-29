import { describe, expect, test } from "vitest";
import { validateSourceCapture } from "../../evaluator/core/sourceValidation";
import type { PageTarget, SourceCapture } from "../../evaluator/core/types";

const target: PageTarget = {
  id: "baidu",
  name: "百度首页",
  originalUrl: "https://www.baidu.com",
  replicaUrl: "http://127.0.0.1:5173/replica/baidu",
  criticalSelectors: ["#kw", "#su"],
  expectedTitleIncludes: ["百度"],
  expectedUrlIncludes: ["baidu.com"],
  viewports: [{ name: "desktop", width: 1365, height: 768 }],
};

const validCapture: SourceCapture = {
  requestedUrl: "https://www.baidu.com",
  finalUrl: "https://www.baidu.com/",
  status: 200,
  title: "百度一下，你就知道",
  bodyTextSample: "百度一下",
  screenshotPath: "reports/latest/assets/baidu/original-desktop.png",
  screenshot: { width: 1365, height: 768, blank: false },
  selectors: {
    "#kw": { count: 1, visibleCount: 1 },
    "#su": { count: 1, visibleCount: 1 },
  },
};

describe("validateSourceCapture", () => {
  test("passes when the original page is reachable and all critical evidence is present", () => {
    const result = validateSourceCapture(target, validCapture);

    expect(result.status).toBe("passed");
    expect(result.canScore).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  test("fails closed when critical selectors are missing", () => {
    const result = validateSourceCapture(target, {
      ...validCapture,
      selectors: {
        "#kw": { count: 1, visibleCount: 1 },
        "#su": { count: 0, visibleCount: 0 },
      },
    });

    expect(result.status).toBe("failed");
    expect(result.canScore).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "MISSING_CRITICAL_SELECTOR",
        message: expect.stringContaining("#su"),
      }),
    );
  });

  test("keeps scoring open when critical selectors exist but Playwright reports them hidden", () => {
    const result = validateSourceCapture(target, {
      ...validCapture,
      selectors: {
        "#kw": { count: 1, visibleCount: 0 },
        "#su": { count: 1, visibleCount: 0 },
      },
    });

    expect(result.status).toBe("passed");
    expect(result.canScore).toBe(true);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        code: "HIDDEN_CRITICAL_SELECTOR",
      }),
    );
  });

  test("fails closed for suspicious error or interception pages", () => {
    const result = validateSourceCapture(target, {
      ...validCapture,
      finalUrl: "https://www.baidu.com/error",
      title: "访问受限",
      bodyTextSample: "Access denied",
    });

    expect(result.status).toBe("failed");
    expect(result.canScore).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("SUSPICIOUS_PAGE");
  });

  test("fails closed for blank screenshots", () => {
    const result = validateSourceCapture(target, {
      ...validCapture,
      screenshot: { width: 1365, height: 768, blank: true },
    });

    expect(result.status).toBe("failed");
    expect(result.canScore).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("INVALID_SCREENSHOT");
  });
});
