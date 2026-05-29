import type { PageEvaluationResult, PageTarget, StateCapture, ValidationIssue } from "./types.js";

interface AntiCheatStats {
  imageAreaRatio: number;
  canvasAreaRatio: number;
  backgroundImageAreaRatio: number;
  textNodeLength: number;
  interactiveControlCount: number;
  focusableControlCount: number;
  base64ImageCount: number;
  coreTextCoverage: number;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function coreTextCoverage(target: PageTarget, capture: StateCapture): number {
  const expected = target.expectedTextIncludes ?? [];
  if (expected.length === 0) {
    return capture.bodyTextSample.trim().length > 0 ? 1 : 0;
  }

  const haystack = normalizeText(capture.bodyTextSample);
  const matched = expected.filter((text) => haystack.includes(normalizeText(text))).length;
  return matched / expected.length;
}

function statsFor(target: PageTarget, capture: StateCapture): AntiCheatStats {
  return {
    imageAreaRatio: capture.domProfile?.imageAreaRatio ?? 0,
    canvasAreaRatio: capture.domProfile?.canvasAreaRatio ?? 0,
    backgroundImageAreaRatio: capture.domProfile?.backgroundImageAreaRatio ?? 0,
    textNodeLength: capture.domProfile?.textNodeLength ?? capture.bodyTextSample.trim().length,
    interactiveControlCount:
      capture.domProfile?.interactiveControlCount ??
      ((capture.domProfile?.landmarks.button ?? 0) + (capture.domProfile?.landmarks.input ?? 0)),
    focusableControlCount: capture.domProfile?.focusableControlCount ?? 0,
    base64ImageCount: capture.domProfile?.base64ImageCount ?? 0,
    coreTextCoverage: coreTextCoverage(target, capture),
  };
}

function issue(code: string, message: string): ValidationIssue {
  return { severity: "error", code, message };
}

export function validateAntiCheatGate(
  target: PageTarget,
  replicaCaptures: StateCapture[],
): PageEvaluationResult["sourceValidation"] {
  const issues: ValidationIssue[] = [];
  const hasImageDenseException = (target.antiCheatExceptions ?? []).some(
    (item) => (item.allowedAreaRatio ?? 0) > 0.65,
  );

  for (const capture of replicaCaptures) {
    const stats = statsFor(target, capture);
    const mediaAreaRatio = Math.max(
      stats.imageAreaRatio,
      stats.canvasAreaRatio,
      stats.backgroundImageAreaRatio,
    );

    if (!hasImageDenseException && mediaAreaRatio > 0.65 && stats.coreTextCoverage < 0.5) {
      issues.push(
        issue(
          "SCREENSHOT_AS_PAGE",
          `${capture.stateId} 疑似使用图片/Canvas/背景图充当主体网页：mediaAreaRatio=${mediaAreaRatio.toFixed(2)}，coreTextCoverage=${stats.coreTextCoverage.toFixed(2)}`,
        ),
      );
    }

    if (stats.base64ImageCount >= 3 && stats.textNodeLength < 100) {
      issues.push(
        issue(
          "BASE64_IMAGE_HEAVY_PAGE",
          `${capture.stateId} 存在大量 base64 图片且 DOM 文本过少，疑似截图伪页面。`,
        ),
      );
    }

    if (stats.interactiveControlCount > 0 && stats.focusableControlCount === 0) {
      issues.push(
        issue(
          "UNFOCUSABLE_CONTROLS",
          `${capture.stateId} 检测到控件但没有可聚焦控件，可能使用不可交互热点或伪控件。`,
        ),
      );
    }
  }

  return {
    status: issues.length > 0 ? "failed" : "passed",
    canScore: issues.length === 0,
    finalUrl: replicaCaptures[0]?.finalUrl ?? target.replicaUrl,
    issues,
    captureMode: "baseline",
  };
}
