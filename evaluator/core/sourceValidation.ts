import type {
  PageTarget,
  SourceCapture,
  SourceValidationResult,
  ValidationIssue,
} from "./types.js";

const suspiciousSignals = [
  "access denied",
  "forbidden",
  "not found",
  "error",
  "captcha",
  "验证码",
  "访问受限",
  "拒绝访问",
  "页面不存在",
  "安全验证",
];

function containsAny(value: string, patterns: string[] | undefined): boolean {
  if (!patterns || patterns.length === 0) {
    return true;
  }

  return patterns.some((pattern) =>
    value.toLowerCase().includes(pattern.toLowerCase()),
  );
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  message: string,
  severity: ValidationIssue["severity"] = "error",
): void {
  issues.push({ severity, code, message });
}

export function validateSourceCapture(
  target: PageTarget,
  capture: SourceCapture,
): SourceValidationResult {
  const issues: ValidationIssue[] = [];

  if (capture.error) {
    addIssue(issues, "CAPTURE_ERROR", `原网页采集异常：${capture.error}`);
  }

  if (capture.fromProjectBaseline) {
    addIssue(
      issues,
      "PROJECT_BASELINE_SOURCE",
      `原网页证据来自 Phase 3 已确认截图/DOM 基线：${capture.baselinePath ?? "未记录路径"}`,
      "info",
    );
  } else if (capture.fallbackFromBaseline) {
    addIssue(
      issues,
      "SOURCE_FALLBACK_SCREENSHOT",
      `原网页实时采集遇到验证问题，已使用最近一次成功截图/DOM 基准降级评估：${capture.fallbackReason ?? "未记录原因"}`,
      "warning",
    );
  }

  if (
    !capture.manualVerified &&
    (capture.status === null || capture.status < 200 || capture.status >= 400)
  ) {
    addIssue(
      issues,
      "HTTP_STATUS",
      `原网页 HTTP 状态异常：${capture.status ?? "unknown"}`,
    );
  }

  if (!containsAny(capture.finalUrl, target.expectedUrlIncludes)) {
    addIssue(
      issues,
      "URL_MISMATCH",
      `最终 URL 与目标页面不匹配：${capture.finalUrl}`,
    );
  }

  if (!containsAny(capture.title, target.expectedTitleIncludes)) {
    addIssue(
      issues,
      "TITLE_MISMATCH",
      `页面标题与目标页面不匹配：${capture.title || "(empty)"}`,
    );
  }

  if (!containsAny(capture.bodyTextSample, target.expectedTextIncludes)) {
    addIssue(issues, "TEXT_MISMATCH", "页面正文缺少目标页面的关键文本。");
  }

  const haystack = `${capture.finalUrl}\n${capture.title}\n${capture.bodyTextSample}`;
  if (suspiciousSignals.some((signal) => haystack.toLowerCase().includes(signal))) {
    addIssue(
      issues,
      "SUSPICIOUS_PAGE",
      "原网页疑似错误页、拦截页、验证码页或访问受限页面。",
    );
  }

  if (
    !capture.screenshot ||
    capture.screenshot.width <= 0 ||
    capture.screenshot.height <= 0 ||
    capture.screenshot.blank
  ) {
    addIssue(issues, "INVALID_SCREENSHOT", "原网页截图无效或疑似空白截图。");
  }

  for (const selector of target.criticalSelectors) {
    const selectorCapture = capture.selectors[selector];
    if (!selectorCapture || selectorCapture.count === 0) {
      addIssue(
        issues,
        "MISSING_CRITICAL_SELECTOR",
        `缺失关键元素或元素不可见：${selector}`,
      );
    } else if (selectorCapture.visibleCount === 0) {
      addIssue(
        issues,
        "HIDDEN_CRITICAL_SELECTOR",
        `关键元素存在，但自动可见性检测为不可见，后续需结合截图或 Chrome 实操复核：${selector}`,
        "warning",
      );
    }
  }

  const hasError = issues.some((issue) => issue.severity === "error");

  return {
    status: hasError ? "failed" : "passed",
    canScore: !hasError,
    finalUrl: capture.finalUrl,
    issues,
    captureMode: capture.fromProjectBaseline || capture.fallbackFromBaseline ? "baseline" : "live",
  };
}
