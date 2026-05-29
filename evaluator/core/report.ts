import { buildSixDimensionalReport, type DimensionId, type SixDimensionalEvaluationReport } from "./reportModel.js";
import type { EvaluationReport, PageEvaluationResult, ValidationIssue } from "./types.js";

type ReportInput = EvaluationReport | SixDimensionalEvaluationReport;

const dimensionLabels: Record<DimensionId, string> = {
  functionality: "功能正确性",
  interaction: "交互流程一致性",
  visual: "视觉一致性",
  structure: "结构语义一致性",
  content: "内容数据一致性",
  engineering: "工程可维护性",
};

function isRichReport(report: ReportInput): report is SixDimensionalEvaluationReport {
  return "schemaVersion" in report && report.schemaVersion === "2.0" && "summary" in report;
}

function toRichReport(report: ReportInput): SixDimensionalEvaluationReport {
  return isRichReport(report) ? report : buildSixDimensionalReport(report);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function markdownEscape(value: unknown): string {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

function renderIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return "- 无\n";
  }

  return issues
    .map((issue) => `- [${issue.severity}] ${issue.code}: ${issue.message}`)
    .join("\n")
    .concat("\n");
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
    ? "Phase 3 截图/DOM 基线评估"
    : "实时原站采集评估";
}

function renderLegacyPage(page: PageEvaluationResult): string {
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
    lines.push("### 硬门禁失败", "");
    lines.push("本页面未生成一致性总分，因为原站基线、复刻运行或反截图伪页面门禁未通过。", "");
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
    lines.push(`| 功能正确性 | ${page.score.metrics.functionality} |`);
    lines.push(`| 交互流程一致性 | ${page.score.metrics.interaction} |`);
    lines.push(`| 视觉一致性 | ${page.score.metrics.visual} |`);
    lines.push(`| 结构语义一致性 | ${page.score.metrics.structure} |`);
    lines.push(`| 内容数据一致性 | ${page.score.metrics.content} |`);
    lines.push(`| 工程可维护性 | ${page.score.metrics.engineering} |`);
    lines.push("");
  }

  lines.push("### 问题列表", "");
  lines.push(renderIssues(page.issues ?? []));
  return lines.join("\n");
}

function renderDimensionTable(report: SixDimensionalEvaluationReport): string[] {
  const lines = [
    "| 维度 | 权重 | 分数 | 加权贡献 | 状态 | 问题数 |",
    "| --- | ---: | ---: | ---: | --- | ---: |",
  ];

  for (const dimension of report.dimensions) {
    lines.push(
      `| ${dimension.name} | ${Math.round(dimension.weight * 100)}% | ${dimension.score} | ${dimension.weightedContribution} | ${dimension.status} | ${dimension.issueCount} |`,
    );
  }

  return lines;
}

function renderPageMatrix(report: SixDimensionalEvaluationReport): string[] {
  const lines = [
    "| 页面 | 总分 | 功能 | 交互 | 视觉 | 结构 | 内容 | 工程 | 结论 | 评估方式 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |",
  ];

  for (const page of report.pages) {
    const metrics = page.score?.metrics;
    lines.push(
      `| ${page.name} | ${page.score?.total ?? "未评分"} | ${metrics?.functionality ?? "-"} | ${metrics?.interaction ?? "-"} | ${metrics?.visual ?? "-"} | ${metrics?.structure ?? "-"} | ${metrics?.content ?? "-"} | ${metrics?.engineering ?? "-"} | ${page.gateStatus === "passed" ? page.score?.level ?? "通过" : "不通过"} | ${page.captureMode === "baseline" ? "Phase 3 截图/DOM 基线评估" : "实时原站采集评估"} |`,
    );
  }

  return lines;
}

function renderTopIssues(report: SixDimensionalEvaluationReport): string[] {
  const lines = [
    "| 优先级 | 维度 | 严重级别 | 页面 | 状态 | 问题 | 影响分 | 置信度 | 建议 |",
    "| ---: | --- | --- | --- | --- | --- | ---: | ---: | --- |",
  ];
  const topIssues = report.issues.slice(0, 10);

  if (topIssues.length === 0) {
    lines.push("| - | - | - | - | - | 无高优先级问题 | - | - | - |");
    return lines;
  }

  topIssues.forEach((issue, index) => {
    lines.push(
      `| P${index} | ${dimensionLabels[issue.dimension]} | ${issue.severity} | ${issue.pageId} | ${issue.stateId ?? "-"} | ${markdownEscape(issue.title)} | -${issue.impactScore} | ${Math.round(issue.confidence * 100)}% | ${markdownEscape(issue.suggestedFix)} |`,
    );
  });

  return lines;
}

function renderStateMatrix(report: SixDimensionalEvaluationReport): string[] {
  const lines = [
    "| 页面 | 状态 | required | 原站/复刻门禁 | 功能 | 交互 | 视觉 | 结构 | 内容 | 工程 | 结论 |",
    "| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ];

  for (const page of report.pages) {
    if (page.states.length === 0) {
      lines.push(`| ${page.name} | 默认状态 | 是 | ${page.gateStatus} | ${page.score?.metrics.functionality ?? "-"} | ${page.score?.metrics.interaction ?? "-"} | ${page.score?.metrics.visual ?? "-"} | ${page.score?.metrics.structure ?? "-"} | ${page.score?.metrics.content ?? "-"} | ${page.score?.metrics.engineering ?? "-"} | ${page.score?.level ?? "未评分"} |`);
      continue;
    }

    for (const state of page.states) {
      lines.push(
        `| ${page.name} | ${state.name} \`${state.stateId}\` | ${state.required ? "是" : "否"} | ${state.status} | ${state.score?.functionality ?? "-"} | ${state.score?.interaction ?? "-"} | ${state.score?.visual ?? "-"} | ${state.score?.structure ?? "-"} | ${state.score?.content ?? "-"} | ${state.score?.engineering ?? "-"} | ${state.status === "passed" ? page.score?.level ?? "通过" : "阻断"} |`,
      );
    }
  }

  return lines;
}

function buildRichMarkdownReport(report: SixDimensionalEvaluationReport): string {
  const lines = [
    "# 网页复刻一致性评估报告",
    "",
    `生成时间：${report.run.generatedAt}`,
    "评估体系：六维评估体系 v2.0",
    `目标配置：${report.run.targetConfig}`,
    `浏览器：${report.run.browser}`,
    `视口：${report.run.viewports.join("、") || "未记录"}`,
    "",
    "## 1. 总览",
    "",
    `总分：${report.summary.totalScore} / 100`,
    `结论：${report.summary.conclusion}`,
    `门禁：${report.summary.gateStatus}`,
    `核心维度最低分：${report.summary.lowestDimension ? `${report.summary.lowestDimension.name} ${report.summary.lowestDimension.score}` : "未评分"}`,
    `页面数：${report.summary.pageCount}`,
    `状态数：${report.summary.stateCount}`,
    `失败状态数：${report.summary.failedStateCount}`,
    `高危问题数：${report.summary.highRiskIssueCount}`,
    "",
  ];

  if (report.summary.gateStatus === "failed") {
    lines.push("### 硬门禁失败", "");
    lines.push("本次评估存在原站基线、复刻运行、required 状态、反截图伪页面或可复现性门禁失败；总分仅供定位问题，不作为通过依据。", "");
    lines.push("| 门禁 | 页面 | 结果 | 说明 |");
    lines.push("| --- | --- | --- | --- |");
    for (const gate of report.gates.filter((gate) => gate.status === "failed")) {
      lines.push(`| ${gate.name} | ${gate.pageId ?? "-"} | ${gate.status} | ${markdownEscape(gate.message ?? "")} |`);
    }
    lines.push("");
  }

  lines.push(
    ...renderDimensionTable(report),
    "",
    "## 2. 页面 × 六维矩阵",
    "",
    ...renderPageMatrix(report),
    "",
    "## 3. 高优先级问题",
    "",
    ...renderTopIssues(report),
    "",
    "## 4. 六维详情",
    "",
  );

  report.dimensions.forEach((dimension, index) => {
    lines.push(`### 4.${index + 1} ${dimension.name}`, "");
    lines.push(`分数：${dimension.score} / 100`);
    lines.push(`权重：${Math.round(dimension.weight * 100)}%`);
    lines.push(`加权贡献：${dimension.weightedContribution}`);
    lines.push(`状态：${dimension.status}`);
    lines.push(`修复建议：${dimension.recommendation}`, "");
    lines.push("| 子项 | 权重 | 分数 | 说明 |");
    lines.push("| --- | ---: | ---: | --- |");
    for (const subMetric of dimension.subMetrics) {
      lines.push(`| ${subMetric.name} | ${Math.round(subMetric.weight * 100)}% | ${subMetric.score} | ${subMetric.description} |`);
    }
    lines.push("");
  });

  lines.push("## 5. 页面详情", "");
  lines.push(...renderStateMatrix(report));
  lines.push("");

  for (const page of report.pages) {
    lines.push(`### ${page.name}`, "");
    lines.push(`- 页面 ID：\`${page.pageId}\``);
    lines.push(`- 原始地址：${page.originalUrl || "未配置"}`);
    lines.push(`- 复刻地址：${page.replicaUrl}`);
    lines.push(`- 最终 URL：${page.finalUrl || "未获取"}`);
    lines.push(`- 评估方式：${page.captureMode === "baseline" ? "Phase 3 截图/DOM 基线评估" : "实时原站采集评估"}`);
    lines.push(`- 门禁：${page.gateStatus}`, "");

    if (page.interactions.length > 0) {
      lines.push("#### 交互用例", "");
      lines.push("| 用例 | 状态 | 失败步骤 | 说明 | 证据 |");
      lines.push("| --- | --- | ---: | --- | --- |");
      for (const interaction of page.interactions) {
        lines.push(
          `| ${markdownEscape(interaction.name)} | ${interaction.passed ? "通过" : "失败"} | ${interaction.failedStep ?? ""} | ${markdownEscape(interaction.message ?? "")} | ${interaction.screenshot ?? ""} |`,
        );
      }
      lines.push("");
    }

    if (page.artifacts?.visualDiffs?.length || page.artifacts?.regionDiffs?.length) {
      lines.push("#### 视觉证据", "");
      for (const artifact of [...(page.artifacts.visualDiffs ?? []), ...(page.artifacts.regionDiffs ?? [])]) {
        lines.push(`- ${artifact}`);
      }
      lines.push("");
    }

    if (page.issues.length > 0) {
      lines.push("#### 问题与修复建议", "");
      lines.push("| 维度 | 严重级别 | 问题 | 建议 | 证据 |");
      lines.push("| --- | --- | --- | --- | --- |");
      for (const issue of page.issues) {
        lines.push(
          `| ${dimensionLabels[issue.dimension]} | ${issue.severity} | ${markdownEscape(issue.description)} | ${markdownEscape(issue.suggestedFix)} | ${issue.artifactLinks.join("<br>") || "-"} |`,
        );
      }
      lines.push("");
    }
  }

  lines.push("## 6. 历史对比", "");
  lines.push(report.history?.message ?? "当前没有可用历史对比数据。");
  lines.push("");
  lines.push("## 7. 证据中心", "");
  lines.push("| 维度 | 证据数量 | 代表产物 |");
  lines.push("| --- | ---: | --- |");
  for (const dimension of report.dimensions) {
    const artifacts = report.artifacts.byDimension[dimension.id] ?? [];
    lines.push(`| ${dimension.name} | ${artifacts.length} | ${artifacts.slice(0, 3).join("<br>") || "-"} |`);
  }
  lines.push("");

  return lines.join("\n");
}

export function buildMarkdownReport(report: ReportInput): string {
  if (!isRichReport(report)) {
    return buildRichMarkdownReport(buildSixDimensionalReport(report));
  }

  return buildRichMarkdownReport(report);
}

function statusClass(status: string): string {
  if (status === "excellent" || status === "passed" || status === "pass") {
    return "good";
  }
  if (status === "warning" || status === "needs-work") {
    return "warn";
  }
  return "bad";
}

function renderHtmlTable(headers: string[], rows: string[][]): string {
  return `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function buildHtmlReportBody(report: SixDimensionalEvaluationReport): string {
  const dimensionCards = report.dimensions
    .map(
      (dimension) => `
        <section class="metric-card ${statusClass(dimension.status)}">
          <div class="metric-title">${escapeHtml(dimension.name)}</div>
          <div class="metric-score">${escapeHtml(dimension.score)}</div>
          <div class="metric-meta">权重 ${Math.round(dimension.weight * 100)}% · 贡献 ${dimension.weightedContribution}</div>
          <div class="metric-meta">问题 ${dimension.issueCount} · ${escapeHtml(dimension.status)}</div>
        </section>`,
    )
    .join("");

  const pageMatrix = renderHtmlTable(
    ["页面", "总分", "功能", "交互", "视觉", "结构", "内容", "工程", "结论", "评估方式"],
    report.pages.map((page) => {
      const metrics = page.score?.metrics;
      return [
        escapeHtml(page.name),
        escapeHtml(page.score?.total ?? "未评分"),
        escapeHtml(metrics?.functionality ?? "-"),
        escapeHtml(metrics?.interaction ?? "-"),
        escapeHtml(metrics?.visual ?? "-"),
        escapeHtml(metrics?.structure ?? "-"),
        escapeHtml(metrics?.content ?? "-"),
        escapeHtml(metrics?.engineering ?? "-"),
        `<span class="pill ${statusClass(page.gateStatus)}">${escapeHtml(page.gateStatus === "passed" ? page.score?.level ?? "通过" : "不通过")}</span>`,
        escapeHtml(page.captureMode === "baseline" ? "Phase 3 截图/DOM 基线评估" : "实时原站采集评估"),
      ];
    }),
  );

  const issueRows = report.issues.slice(0, 20).map((issue, index) => [
    escapeHtml(`P${index}`),
    escapeHtml(dimensionLabels[issue.dimension]),
    `<span class="pill ${statusClass(issue.severity === "info" ? "pass" : issue.severity)}">${escapeHtml(issue.severity)}</span>`,
    escapeHtml(issue.pageId),
    escapeHtml(issue.stateId ?? "-"),
    escapeHtml(issue.title),
    escapeHtml(`-${issue.impactScore}`),
    escapeHtml(issue.suggestedFix),
  ]);

  const issueCenter = renderHtmlTable(
    ["优先级", "维度", "严重级别", "页面", "状态", "问题", "影响分", "建议"],
    issueRows.length > 0 ? issueRows : [["-", "-", "-", "-", "-", "无高优先级问题", "-", "-"]],
  );

  const stateRows = report.pages.flatMap((page) => {
    const states = page.states.length > 0
      ? page.states
      : [{
          stateId: "default",
          name: "默认状态",
          required: true,
          status: page.gateStatus,
          score: page.score?.metrics,
        }];
    return states.map((state) => [
      escapeHtml(page.name),
      escapeHtml(`${state.name} (${state.stateId})`),
      escapeHtml(state.required ? "是" : "否"),
      `<span class="pill ${statusClass(state.status)}">${escapeHtml(state.status)}</span>`,
      escapeHtml(state.score?.functionality ?? "-"),
      escapeHtml(state.score?.interaction ?? "-"),
      escapeHtml(state.score?.visual ?? "-"),
      escapeHtml(state.score?.structure ?? "-"),
      escapeHtml(state.score?.content ?? "-"),
      escapeHtml(state.score?.engineering ?? "-"),
    ]);
  });

  const stateMatrix = renderHtmlTable(
    ["页面", "状态", "required", "门禁", "功能", "交互", "视觉", "结构", "内容", "工程"],
    stateRows,
  );

  const dimensionDetails = report.dimensions
    .map(
      (dimension) => `
        <section class="panel" id="dimension-${dimension.id}">
          <h3>${escapeHtml(dimension.name)}</h3>
          <p><strong>分数：</strong>${escapeHtml(dimension.score)} / 100 · <strong>建议：</strong>${escapeHtml(dimension.recommendation)}</p>
          ${renderHtmlTable(
            ["子项", "权重", "分数", "说明"],
            dimension.subMetrics.map((item) => [
              escapeHtml(item.name),
              escapeHtml(`${Math.round(item.weight * 100)}%`),
              escapeHtml(item.score),
              escapeHtml(item.description),
            ]),
          )}
        </section>`,
    )
    .join("");

  const evidenceRows = report.dimensions.map((dimension) => {
    const artifacts = report.artifacts.byDimension[dimension.id] ?? [];
    return [
      escapeHtml(dimension.name),
      escapeHtml(artifacts.length),
      artifacts.slice(0, 5).map((artifact) => `<code>${escapeHtml(artifact)}</code>`).join("<br>") || "-",
    ];
  });

  return `
    <header class="hero">
      <div>
        <p class="eyebrow">六维证据驱动评估报告 v2.0</p>
        <h1>网页复刻一致性评估报告</h1>
        <p>生成时间：${escapeHtml(report.run.generatedAt)} · 目标配置：${escapeHtml(report.run.targetConfig)} · 浏览器：${escapeHtml(report.run.browser)}</p>
      </div>
      <div class="score-block ${statusClass(report.summary.conclusion)}">
        <span>总分</span>
        <strong>${escapeHtml(report.summary.totalScore)}</strong>
        <em>${escapeHtml(report.summary.conclusion)}</em>
      </div>
    </header>

    <section class="dashboard">
      <article><span>门禁状态</span><strong>${escapeHtml(report.summary.gateStatus)}</strong></article>
      <article><span>核心维度最低分</span><strong>${escapeHtml(report.summary.lowestDimension ? `${report.summary.lowestDimension.name} ${report.summary.lowestDimension.score}` : "未评分")}</strong></article>
      <article><span>页面 / 状态</span><strong>${escapeHtml(`${report.summary.pageCount} / ${report.summary.stateCount}`)}</strong></article>
      <article><span>失败状态</span><strong>${escapeHtml(report.summary.failedStateCount)}</strong></article>
      <article><span>高危问题</span><strong>${escapeHtml(report.summary.highRiskIssueCount)}</strong></article>
    </section>

    <section class="metric-grid">${dimensionCards}</section>

    <section class="panel">
      <h2>页面 × 六维矩阵</h2>
      ${pageMatrix}
    </section>

    <section class="panel">
      <h2>状态矩阵</h2>
      ${stateMatrix}
    </section>

    <section class="panel">
      <h2>问题中心</h2>
      ${issueCenter}
    </section>

    <section class="dimension-stack">
      <h2>六维详情</h2>
      ${dimensionDetails}
    </section>

    <section class="panel">
      <h2>证据中心</h2>
      ${renderHtmlTable(["维度", "证据数量", "代表产物"], evidenceRows)}
    </section>

    <section class="panel">
      <h2>历史对比</h2>
      <p>${escapeHtml(report.history?.message ?? "当前没有可用历史对比数据。")}</p>
    </section>`;
}

export function buildHtmlReport(report: ReportInput): string {
  const richReport = toRichReport(report);

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>网页复刻一致性评估报告</title>
    <style>
      :root { color-scheme: light; --border: #d8dee8; --text: #17202a; --muted: #687386; --bg: #f5f7fb; --panel: #ffffff; --good: #0b7a45; --warn: #9a5b00; --bad: #b42318; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; }
      main { max-width: 1180px; margin: 0 auto; padding: 32px 20px 56px; }
      h1, h2, h3, p { margin-top: 0; }
      h1 { font-size: 30px; margin-bottom: 8px; letter-spacing: 0; }
      h2 { font-size: 22px; margin-bottom: 16px; }
      h3 { font-size: 18px; margin-bottom: 12px; }
      .hero { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: stretch; margin-bottom: 20px; }
      .eyebrow { color: var(--muted); font-size: 13px; margin-bottom: 6px; }
      .score-block, .dashboard article, .metric-card, .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; }
      .score-block { min-width: 180px; padding: 18px; display: grid; gap: 4px; }
      .score-block span, .dashboard span, .metric-meta { color: var(--muted); font-size: 13px; }
      .score-block strong { font-size: 40px; line-height: 1; }
      .score-block em { font-style: normal; font-weight: 600; }
      .dashboard { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
      .dashboard article { padding: 14px; display: grid; gap: 6px; min-height: 78px; }
      .dashboard strong { font-size: 20px; }
      .metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
      .metric-card { padding: 16px; border-left-width: 5px; }
      .metric-title { font-weight: 700; }
      .metric-score { font-size: 34px; font-weight: 800; line-height: 1.1; margin: 8px 0; }
      .panel { padding: 18px; margin-bottom: 18px; overflow-x: auto; }
      .dimension-stack .panel { margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { border-bottom: 1px solid var(--border); padding: 9px 10px; text-align: left; vertical-align: top; }
      th { color: #3c4658; background: #f8fafc; font-weight: 700; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
      .pill { display: inline-flex; align-items: center; min-height: 24px; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #eef2f7; color: var(--text); }
      .good { border-left-color: var(--good); color: var(--good); }
      .warn { border-left-color: var(--warn); color: var(--warn); }
      .bad { border-left-color: var(--bad); color: var(--bad); }
      .pill.good { background: #e8f5ee; }
      .pill.warn { background: #fff4df; }
      .pill.bad { background: #fdeceb; }
      @media (max-width: 820px) {
        .hero, .dashboard, .metric-grid { grid-template-columns: 1fr; }
        main { padding: 20px 12px 40px; }
      }
    </style>
  </head>
  <body>
    <main>${buildHtmlReportBody(richReport)}</main>
  </body>
</html>
`;
}

export function buildLegacyMarkdownReport(report: EvaluationReport): string {
  return [
    "# 一致性评估报告",
    "",
    `生成时间：${report.generatedAt}`,
    "",
    ...report.pages.map(renderLegacyPage),
    "",
  ].join("\n");
}
