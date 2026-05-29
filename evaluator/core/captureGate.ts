import type { PageEvaluationResult } from "./types.js";

export function shouldInterruptEvaluation(pages: PageEvaluationResult[]): boolean {
  return pages.some((page) => !page.sourceValidation.canScore);
}

export function buildCaptureGateMessage(pages: PageEvaluationResult[]): string {
  const failedPages = pages.filter((page) => !page.sourceValidation.canScore);
  const lines = [
    "评估已中断：原始真实页面状态采集未通过可信性门禁。",
    "为避免基于错误页面、验证码页或主观猜测继续评分，本次不会生成复刻一致性总分。",
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
  lines.push("请先在真实浏览器中完成安全验证/AI 校验/验证码，确认目标状态可正常打开后，再重新运行：");
  lines.push("npm run eval");
  lines.push("");
  lines.push("诊断文件：reports/latest/source-validation.json");

  return lines.join("\n");
}
