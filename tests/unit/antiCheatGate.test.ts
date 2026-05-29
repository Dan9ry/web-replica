import { describe, expect, test } from "vitest";
import { validateAntiCheatGate } from "../../evaluator/core/antiCheatGate";
import type { PageTarget, StateCapture } from "../../evaluator/core/types";

const target: PageTarget = {
  id: "demo",
  name: "Demo",
  originalUrl: "https://example.com",
  replicaUrl: "http://127.0.0.1:5173/replica/demo",
  criticalSelectors: ["body"],
  expectedTextIncludes: ["Search"],
  viewports: [{ name: "desktop", width: 1365, height: 768 }],
};

function replicaCapture(overrides: Partial<StateCapture> = {}): StateCapture {
  return {
    stateId: "home",
    side: "replica",
    viewport: "desktop",
    requestedUrl: target.replicaUrl,
    finalUrl: target.replicaUrl,
    status: 200,
    title: "Demo",
    bodyTextSample: "Search",
    selectors: { body: { count: 1, visibleCount: 1 } },
    screenshot: { width: 1365, height: 768, blank: false },
    domProfile: {
      landmarks: { main: 1, button: 1, input: 1 },
      textSample: "Search",
      textNodeLength: 6,
      imageAreaRatio: 0.1,
      canvasAreaRatio: 0,
      backgroundImageAreaRatio: 0,
      interactiveControlCount: 2,
      focusableControlCount: 2,
      base64ImageCount: 0,
      styles: {},
    },
    ...overrides,
  };
}

describe("validateAntiCheatGate", () => {
  test("passes normal interactive DOM pages", () => {
    const result = validateAntiCheatGate(target, [replicaCapture()]);

    expect(result.canScore).toBe(true);
  });

  test("fails screenshot-like pages with high image area and low text coverage", () => {
    const result = validateAntiCheatGate(target, [
      replicaCapture({
        bodyTextSample: "",
        domProfile: {
          landmarks: {},
          textSample: "",
          textNodeLength: 0,
          imageAreaRatio: 0.9,
          canvasAreaRatio: 0,
          backgroundImageAreaRatio: 0,
          interactiveControlCount: 0,
          focusableControlCount: 0,
          base64ImageCount: 1,
          styles: {},
        },
      }),
    ]);

    expect(result.canScore).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "SCREENSHOT_AS_PAGE" }),
    );
  });
});
