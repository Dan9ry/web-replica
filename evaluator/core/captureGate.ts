import type { CaptureSide, PageEvaluationResult, StateCapture } from "./types.js";

const securitySignals = [
  "wappass.baidu.com",
  "captcha",
  "验证码",
  "安全验证",
  "ai 校验",
  "AI 校验",
  "访问受限",
  "百度安全验证",
];

interface InteractiveVerificationMessageInput {
  targetName: string;
  stateName: string;
  stateId: string;
  finalUrl: string;
  side: CaptureSide;
}

export function shouldInterruptEvaluation(pages: PageEvaluationResult[]): boolean {
  return pages.some((page) => !page.sourceValidation.canScore);
}

export function buildCaptureGateMessage(pages: PageEvaluationResult[]): string {
  const failedPages = pages.filter((page) => !page.sourceValidation.canScore);
  const lines = [
    "评估已中断：Phase 3 原始真实页面截图/DOM 基线未通过可信性门禁。",
    "为避免基于缺失、错误或不完整的原站证据继续评分，本次不会生成复刻一致性总分。",
    "",
    "需要处理的页面/状态：",
  ];

  for (const page of failedPages) {
    lines.push(`- ${page.name}（${page.pageId}）`);

    const stateResults = page.stateResults ?? page.sourceValidation.stateResults ?? [];
    const failedStates = stateResults.filter((state) => !state.canScore);
    if (failedStates.length === 0) {
      lines.push(`  - 页面门禁失败：${page.sourceValidation.finalUrl || "未获取最终 URL"}`);
      continue;
    }

    for (const state of failedStates) {
      lines.push(`  - ${state.name}（${state.stateId}）：${state.finalUrl || "未获取最终 URL"}`);
      const firstError = state.issues.find((issue) => issue.severity === "error");
      if (firstError) {
        lines.push(`    原因：${firstError.message}`);
      }
    }
  }

  lines.push("");
  lines.push("请回到素材采集阶段，补齐并确认当前复刻项目的原站截图/DOM 基线后，再重新运行：");
  lines.push("npm run eval");
  lines.push("");
  lines.push("诊断文件：reports/latest/source-validation.json");

  return lines.join("\n");
}

export function isSecurityVerificationCapture(capture: StateCapture): boolean {
  const haystack = `${capture.finalUrl}\n${capture.title}\n${capture.bodyTextSample}`;
  return securitySignals.some((signal) =>
    haystack.toLowerCase().includes(signal.toLowerCase()),
  );
}

export function shouldOfferInteractiveRepair(
  capture: StateCapture,
  side: CaptureSide,
): boolean {
  return side === "original" && Boolean(capture.error || isSecurityVerificationCapture(capture));
}

export function shouldUseScreenshotFallback(
  capture: StateCapture,
  side: CaptureSide,
  interactive: boolean,
): boolean {
  return !interactive && shouldOfferInteractiveRepair(capture, side);
}

export function buildInteractiveVerificationMessage({
  targetName,
  stateName,
  stateId,
  finalUrl,
}: InteractiveVerificationMessageInput): string {
  return [
    "",
    "评估已暂停：原始真实页面状态采集遇到安全验证/AI 校验或关键元素未出现。",
    `页面：${targetName}`,
    `状态：${stateName}（${stateId}）`,
    `当前 URL：${finalUrl || "未获取"}`,
    "",
    "请在弹出的浏览器窗口中完成安全验证/AI 校验/验证码，并确认目标真实状态已经正常显示。",
    "完成后回到终端按 Enter 继续；如果仍未通过，评估会按 fail-closed 规则中断。",
    "",
  ].join("\n");
}
