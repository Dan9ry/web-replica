import type { EvaluationReport, PageEvaluationResult, ValidationIssue } from "./types.js";

function renderIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return "- 无\n";
  }

  return issues
    .map((issue) => `- [${issue.severity}] ${issue.code}: ${issue.message}`)
    .join("\n")
    .concat("\n");
}

function renderStateResults(page: PageEvaluationResult): string[] {
  if (!page.stateResults || page.stateResults.length === 0) {
    return [];
  }

  const lines = ["### 原站状态门禁", ""];
  lines.push("| 状态 | 结果 | 最终 URL |");
  lines.push("| --- | --- | --- |");
  for (const state of page.stateResults) {
    lines.push(`| ${state.name} \`${state.stateId}\` | ${state.status} | ${state.finalUrl || "未获取"} |`);
  }
  lines.push("");

  return lines;
}

function captureModeLabel(page: PageEvaluationResult): string {
  const mode =
    page.sourceValidation.captureMode ??
    (page.sourceValidation.issues.some(
      (issue) => issue.code === "SOURCE_FALLBACK_SCREENSHOT",
    )
      ? "baseline"
      : "live");

  return mode === "baseline"
    ? "截图/DOM 基线降级评估"
    : "实时原站采集评估";
}

function renderPage(page: PageEvaluationResult): string {
  const lines = [
    `## ${page.name}`,
    "",
    `- 页面 ID：\`${page.pageId}\``,
    `- 原始地址：${page.originalUrl || "未配置"}`,
    `- 复刻地址：${page.replicaUrl}`,
    `- 原网页门禁：${page.sourceValidation.status}`,
    `- 评估方式：${captureModeLabel(page)}`,
    `- 最终 URL：${page.sourceValidation.finalUrl || "未获取"}`,
    "",
  ];

  if (!page.sourceValidation.canScore) {
    lines.push("### 原网页采集失败", "");
    lines.push("本页面未生成一致性总分，因为原网页采集未通过可信性门禁。", "");
    lines.push(...renderStateResults(page));
    lines.push("### 问题列表", "");
    lines.push(renderIssues(page.sourceValidation.issues));
    return lines.join("\n");
  }

  if (page.score) {
    lines.push(`- 总分：${page.score.totalScore} / 100`);
    lines.push(`- 结论：${page.score.level}`);
    lines.push("");
    lines.push("### 分项得分", "");
    lines.push("| 维度 | 分数 |");
    lines.push("| --- | ---: |");
    lines.push(`| 功能一致性 | ${page.score.metrics.functionality} |`);
    lines.push(`| 交互一致性 | ${page.score.metrics.interaction} |`);
    lines.push(`| 视觉一致性 | ${page.score.metrics.visual} |`);
    lines.push("");
  }

  lines.push(...renderStateResults(page));

  if (page.artifacts?.visualDiffs && page.artifacts.visualDiffs.length > 0) {
    lines.push("### 评估产物", "");
    lines.push(`- 采集数据：${page.artifacts.captures?.original ?? "未生成"}`);
    for (const diff of page.artifacts.visualDiffs) {
      lines.push(`- 视觉差异图：${diff}`);
    }
    lines.push("");
  }

  lines.push("### 问题列表", "");
  lines.push(renderIssues(page.issues ?? []));
  return lines.join("\n");
}

export function buildMarkdownReport(report: EvaluationReport): string {
  return [
    "# 一致性评估报告",
    "",
    `生成时间：${report.generatedAt}`,
    "",
    ...report.pages.map(renderPage),
    "",
  ].join("\n");
}
