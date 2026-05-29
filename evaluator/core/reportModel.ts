import { scoreWeights } from "./scoring.js";
import type {
  EvaluationArtifacts,
  EvaluationReport,
  InteractionCheckResult,
  PageEvaluationResult,
  PageTarget,
  ScoreMetrics,
  ValidationIssue,
} from "./types.js";

export type DimensionId =
  | "functionality"
  | "interaction"
  | "visual"
  | "structure"
  | "content"
  | "engineering";

export type ReportSeverity = "blocker" | "error" | "warning" | "info";

export interface ReportIssue {
  id: string;
  code: string;
  dimension: DimensionId;
  severity: ReportSeverity;
  pageId: string;
  stateId?: string;
  viewportId?: string;
  interactionCaseId?: string;
  stepIndex?: number;
  regionId?: string;
  selector?: string;
  title: string;
  description: string;
  evidence: string[];
  impactScore: number;
  confidence: number;
  rootCauseHint?: string;
  suggestedFix: string;
  artifactLinks: string[];
  status: "new" | "existing" | "fixed" | "regression";
  priorityScore: number;
}

export interface GateResult {
  id: string;
  name: string;
  status: "passed" | "failed";
  pageId?: string;
  message?: string;
}

export interface DimensionSummary {
  id: DimensionId;
  name: string;
  weight: number;
  score: number;
  weightedContribution: number;
  status: "excellent" | "pass" | "warning" | "error" | "critical";
  issueCount: number;
  topIssues: string[];
}

export interface SixDimensionalSummary {
  schemaVersion: "2.0";
  totalScore: number;
  weightedScore: number;
  conclusion: "failed" | "needs-work" | "acceptable" | "excellent";
  gateStatus: "passed" | "failed";
  pageCount: number;
  stateCount: number;
  requiredStateCount: number;
  failedStateCount: number;
  highRiskIssueCount: number;
  lowestDimension?: {
    id: DimensionId;
    name: string;
    score: number;
  };
  dimensions: Record<DimensionId, DimensionSummary>;
  issueCountByDimension: Record<DimensionId, number>;
  issueCountBySeverity: Record<ReportSeverity, number>;
}

export interface DimensionReport extends DimensionSummary {
  subMetrics: Array<{
    id: string;
    name: string;
    weight: number;
    score: number;
    description: string;
    evidence: string[];
  }>;
  pageScores: Array<{
    pageId: string;
    pageName: string;
    score: number;
    status: string;
    worstStates: string[];
    topIssues: string[];
  }>;
  issues: ReportIssue[];
  evidence: string[];
  recommendation: string;
}

export interface PageReport {
  pageId: string;
  name: string;
  originalUrl: string;
  replicaUrl: string;
  captureMode: "live" | "baseline";
  gateStatus: "passed" | "failed";
  finalUrl: string;
  score?: {
    total: number;
    level: string;
    metrics: ScoreMetrics;
  };
  states: Array<{
    stateId: string;
    name: string;
    required: boolean;
    status: "passed" | "failed" | "skipped";
    canScore: boolean;
    finalUrl: string;
    issues: string[];
    score?: ScoreMetrics;
  }>;
  interactions: InteractionCheckResult[];
  issues: ReportIssue[];
  artifacts?: EvaluationArtifacts;
}

export interface ArtifactIndex {
  byDimension: Record<DimensionId, string[]>;
  byPage: Record<string, string[]>;
  all: string[];
}

export interface SixDimensionalEvaluationReport {
  schemaVersion: "2.0";
  run: {
    generatedAt: string;
    targetConfig: string;
    browser: string;
    viewports: string[];
    pageCount: number;
  };
  gates: GateResult[];
  summary: SixDimensionalSummary;
  dimensions: DimensionReport[];
  pages: PageReport[];
  issues: ReportIssue[];
  artifacts: ArtifactIndex;
  history?: {
    status: "unavailable";
    message: string;
  };
}

const dimensions: Array<{ id: DimensionId; name: string; weight: number }> = [
  { id: "functionality", name: "功能正确性", weight: scoreWeights.functionality },
  { id: "interaction", name: "交互流程一致性", weight: scoreWeights.interaction },
  { id: "visual", name: "视觉一致性", weight: scoreWeights.visual },
  { id: "structure", name: "结构语义一致性", weight: scoreWeights.structure },
  { id: "content", name: "内容数据一致性", weight: scoreWeights.content },
  { id: "engineering", name: "工程可维护性", weight: scoreWeights.engineering },
];

const dimensionWeightForPriority: Record<DimensionId, number> = {
  functionality: 1.25,
  interaction: 1.2,
  visual: 1.2,
  structure: 1,
  content: 1,
  engineering: 0.9,
};

const severityWeight: Record<ReportSeverity, number> = {
  blocker: 10,
  error: 5,
  warning: 2,
  info: 1,
};

function emptyDimensionCounts(): Record<DimensionId, number> {
  return {
    functionality: 0,
    interaction: 0,
    visual: 0,
    structure: 0,
    content: 0,
    engineering: 0,
  };
}

function emptySeverityCounts(): Record<ReportSeverity, number> {
  return {
    blocker: 0,
    error: 0,
    warning: 0,
    info: 0,
  };
}

function statusForScore(score: number): DimensionSummary["status"] {
  if (score >= 90) {
    return "excellent";
  }
  if (score >= 85) {
    return "pass";
  }
  if (score >= 75) {
    return "warning";
  }
  if (score >= 60) {
    return "error";
  }
  return "critical";
}

function conclusionFor(totalScore: number, gateStatus: "passed" | "failed"): SixDimensionalSummary["conclusion"] {
  if (gateStatus === "failed") {
    return "failed";
  }
  if (totalScore >= 90) {
    return "excellent";
  }
  if (totalScore >= 85) {
    return "acceptable";
  }
  return "needs-work";
}

function captureModeFor(page: PageEvaluationResult): "live" | "baseline" {
  return page.sourceValidation.captureMode ??
    (page.sourceValidation.issues.some((issue) => issue.code === "SOURCE_FALLBACK_SCREENSHOT")
      ? "baseline"
      : "live");
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (finiteValues.length === 0) {
    return 0;
  }
  return finiteValues.reduce((total, value) => total + value, 0) / finiteValues.length;
}

function dimensionForIssue(issue: ValidationIssue): DimensionId {
  const text = `${issue.code} ${issue.message}`.toLowerCase();
  if (/visual|screenshot|diff|layout|style|pixel|ssim|视觉|截图|布局|样式/.test(text)) {
    return "visual";
  }
  if (/interaction|click|fill|press|enter|hover|focus|assertion|交互|点击|输入|断言|分页/.test(text)) {
    return "interaction";
  }
  if (/content|text|copy|placeholder|data|文案|内容|数据|结果/.test(text)) {
    return "content";
  }
  if (/structure|semantic|selector|dom|anti|cheat|canvas|image|focusable|结构|语义|截图伪/.test(text)) {
    return "structure";
  }
  if (/engineering|build|route|project|source|artifact|工程|构建|项目|产物/.test(text)) {
    return "engineering";
  }
  return "functionality";
}

function suggestedFixFor(dimension: DimensionId, issue: ValidationIssue): string {
  const byCode: Record<string, string> = {
    LOW_VISUAL_SCORE: "按区域 diff 调整布局、字号、颜色、间距和关键控件尺寸，优先修复低分区域。",
    LOW_INTERACTION_SCORE: "补齐失败用例对应的点击、输入、Enter、焦点、即时反馈和状态切换逻辑。",
    LOW_FUNCTIONALITY_SCORE: "补齐 required 状态、核心功能断言、输出结果和边界/异常态。",
    LOW_STRUCTURE_SCORE: "使用真实 DOM、真实表单控件、列表和导航语义，避免截图伪页面或不可聚焦控件。",
    LOW_CONTENT_SCORE: "对齐原站可见文案、placeholder、错误提示、结果项字段和分页数字。",
    LOW_ENGINEERING_SCORE: "确保源码位于当前 project/page，组件、数据、状态、样式清晰拆分并可构建运行。",
  };

  if (byCode[issue.code]) {
    return byCode[issue.code];
  }

  const fallback: Record<DimensionId, string> = {
    functionality: "先复现原站对应状态，再补齐核心功能和边界行为。",
    interaction: "定位失败步骤，补齐用户动作后的状态变化、反馈和断言所需 DOM。",
    visual: "打开对应截图、diff 或区域 diff，对照修复布局与样式差异。",
    structure: "补齐关键 selector 对应的真实 DOM 结构、语义标签和可聚焦控件。",
    content: "使用原站可见 UI 证据补齐文案和数据字段，不补采隐藏字段或敏感数据。",
    engineering: "修复构建、路由、项目目录或评估产物缺失问题。",
  };

  return fallback[dimension];
}

function titleForIssue(issue: ValidationIssue): string {
  if (issue.code.startsWith("LOW_")) {
    return issue.message.split("：")[0] || issue.code;
  }
  return issue.code;
}

function normalizeSeverity(issue: ValidationIssue, page: PageEvaluationResult): ReportSeverity {
  if (!page.sourceValidation.canScore && issue.severity === "error") {
    return "blocker";
  }
  return issue.severity;
}

function artifactsForIssue(page: PageEvaluationResult, dimension: DimensionId): string[] {
  if (!page.artifacts) {
    return [];
  }

  if (dimension === "visual") {
    return [...(page.artifacts.visualDiffs ?? []), ...(page.artifacts.regionDiffs ?? [])];
  }

  if (dimension === "interaction") {
    return page.interactionResults?.map((result) => result.screenshot).filter((path): path is string => Boolean(path)) ?? [];
  }

  return Object.values(page.artifacts.captures ?? {}).filter(Boolean);
}

function reportIssuesForPage(page: PageEvaluationResult): ReportIssue[] {
  const validationIssues = page.issues ?? page.sourceValidation.issues;
  return validationIssues.map((issue, index) => {
    const dimension = dimensionForIssue(issue);
    const severity = normalizeSeverity(issue, page);
    const impactScore =
      severity === "blocker" ? 20 : severity === "error" ? 10 : severity === "warning" ? 4 : 1;
    const confidence = issue.code.startsWith("LOW_") ? 0.78 : 0.9;
    const priorityScore = roundScore(
      severityWeight[severity] * dimensionWeightForPriority[dimension] * impactScore * confidence,
    );

    return {
      id: `${page.pageId}-${issue.code}-${index + 1}`,
      code: issue.code,
      dimension,
      severity,
      pageId: page.pageId,
      title: titleForIssue(issue),
      description: issue.message,
      evidence: artifactsForIssue(page, dimension),
      impactScore,
      confidence,
      suggestedFix: suggestedFixFor(dimension, issue),
      artifactLinks: artifactsForIssue(page, dimension),
      status: "new",
      priorityScore,
    };
  });
}

function interactionIssuesForPage(page: PageEvaluationResult): ReportIssue[] {
  return (page.interactionResults ?? [])
    .filter((result) => !result.passed)
    .map((result, index) => {
      const impactScore = 8;
      const confidence = 0.95;
      return {
        id: `${page.pageId}-INTERACTION_ASSERTION_FAILED-${index + 1}`,
        code: "INTERACTION_ASSERTION_FAILED",
        dimension: "interaction",
        severity: "error",
        pageId: page.pageId,
        stateId: result.stateId,
        interactionCaseId: result.id,
        stepIndex: result.failedStep,
        selector: result.selector,
        title: `${result.name} 未通过`,
        description: result.message ?? "交互断言未通过",
        evidence: result.screenshot ? [result.screenshot] : [],
        impactScore,
        confidence,
        suggestedFix: "按失败步骤复现交互，补齐对应事件处理、状态更新和用户反馈。",
        artifactLinks: result.screenshot ? [result.screenshot] : [],
        status: "new",
        priorityScore: roundScore(severityWeight.error * dimensionWeightForPriority.interaction * impactScore * confidence),
      } satisfies ReportIssue;
    });
}

function artifactsForPage(page: PageEvaluationResult): string[] {
  return [
    ...Object.values(page.artifacts?.captures ?? {}).filter(Boolean),
    ...(page.artifacts?.visualDiffs ?? []),
    ...(page.artifacts?.regionDiffs ?? []),
    ...(page.interactionResults ?? []).map((result) => result.screenshot).filter((path): path is string => Boolean(path)),
  ];
}

function buildArtifactIndex(pages: PageEvaluationResult[]): ArtifactIndex {
  const byDimension: Record<DimensionId, string[]> = {
    functionality: [],
    interaction: [],
    visual: [],
    structure: [],
    content: [],
    engineering: [],
  };
  const byPage: Record<string, string[]> = {};

  for (const page of pages) {
    const pageArtifacts = artifactsForPage(page);
    byPage[page.pageId] = Array.from(new Set(pageArtifacts));
    byDimension.functionality.push(...Object.values(page.artifacts?.captures ?? {}).filter(Boolean));
    byDimension.structure.push(...Object.values(page.artifacts?.captures ?? {}).filter(Boolean));
    byDimension.content.push(...Object.values(page.artifacts?.captures ?? {}).filter(Boolean));
    byDimension.visual.push(...(page.artifacts?.visualDiffs ?? []), ...(page.artifacts?.regionDiffs ?? []));
    byDimension.interaction.push(
      ...(page.interactionResults ?? []).map((result) => result.screenshot).filter((path): path is string => Boolean(path)),
    );
  }

  byDimension.engineering.push("summary.json", "details.json", "artifacts-index.json", "report.md", "index.html");

  for (const key of Object.keys(byDimension) as DimensionId[]) {
    byDimension[key] = Array.from(new Set(byDimension[key]));
  }

  return {
    byDimension,
    byPage,
    all: Array.from(new Set([...Object.values(byPage).flat(), ...Object.values(byDimension).flat()])),
  };
}

function dimensionScore(report: EvaluationReport, dimension: DimensionId): number {
  return roundScore(average(report.pages.map((page) => page.score?.metrics[dimension] ?? 0)));
}

function topIssuesForDimension(issues: ReportIssue[], dimension: DimensionId): string[] {
  return issues
    .filter((issue) => issue.dimension === dimension)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3)
    .map((issue) => issue.id);
}

function recommendationForDimension(dimension: DimensionId, score: number): string {
  if (score >= 90) {
    return "保持当前实现，后续只需防止回归。";
  }

  const recommendations: Record<DimensionId, string> = {
    functionality: "优先修复 required 状态、核心用例、输出结果和边界行为。",
    interaction: "优先修复失败交互用例，尤其是 Enter、点击、焦点、分页和即时反馈。",
    visual: "优先查看区域 diff 和整页 diff，按页面头、中、尾逐段修正布局、字体、颜色和间距。",
    structure: "补齐真实 DOM、控件语义、列表/表单/导航结构，并消除截图伪页面风险。",
    content: "对齐原站可见文案、错误提示、列表字段、表格字段和状态文案。",
    engineering: "完善 project/page 源码组织、样式隔离、日志和评估产物完整性。",
  };

  return recommendations[dimension];
}

function subMetricsForDimension(dimension: DimensionId, report: EvaluationReport): DimensionReport["subMetrics"] {
  const pageScores = report.pages.map((page) => page.score?.metrics[dimension] ?? 0);
  const score = roundScore(average(pageScores));
  const stateCount = report.pages.reduce((total, page) => total + (page.stateResults?.length ?? 0), 0);
  const failedStateCount = report.pages.reduce(
    (total, page) => total + (page.stateResults?.filter((state) => state.status === "failed").length ?? 0),
    0,
  );
  const failedInteractions = report.pages.reduce(
    (total, page) => total + (page.interactionResults?.filter((result) => !result.passed).length ?? 0),
    0,
  );

  const common = { score, evidence: [] as string[] };
  const byDimension: Record<DimensionId, DimensionReport["subMetrics"]> = {
    functionality: [
      { id: "required-state-coverage", name: "required 状态覆盖率", weight: 0.25, score: stateCount === 0 ? score : roundScore(((stateCount - failedStateCount) / stateCount) * 100), description: "required 状态是否有可信原站基线和复刻状态。", evidence: [] },
      { id: "core-use-cases", name: "核心用例断言通过率", weight: 0.35, score, description: "核心交互断言是否通过。", evidence: [] },
      { id: "output-correctness", name: "输出结果正确率", weight: 0.2, score, description: "结果文案、列表和状态输出是否正确。", evidence: [] },
      { id: "boundary-cases", name: "边界/异常态通过率", weight: 0.2, score, description: "空输入、错误态、无结果态等边界行为。", evidence: [] },
    ],
    interaction: [
      { id: "case-pass-rate", name: "交互用例通过率", weight: 0.4, score, description: "交互用例整体通过情况。", evidence: [] },
      { id: "assertion-pass-rate", name: "步骤断言通过率", weight: 0.3, score: failedInteractions === 0 ? score : Math.max(0, score - 5), description: "动作后的可见状态断言是否通过。", evidence: [] },
      { id: "feedback-state", name: "反馈状态一致性", weight: 0.2, score, description: "loading、error、disabled、即时反馈等状态是否一致。", evidence: [] },
      { id: "keyboard-mouse-detail", name: "键盘/鼠标细节一致性", weight: 0.1, score, description: "Enter、hover、focus、blur 等细节。", evidence: [] },
    ],
    visual: [
      { id: "full-page-visual", name: "整页视觉", weight: 0.2, ...common, description: "整页截图 diff 与 SSIM 综合分。" },
      { id: "region-visual", name: "区域加权视觉", weight: 0.45, ...common, description: "关键区域截图、区域 diff、bbox 和样式综合分。" },
      { id: "key-style", name: "关键元素样式", weight: 0.2, ...common, description: "字体、颜色、圆角、控件尺寸等样式对齐。" },
      { id: "box-model", name: "布局盒模型", weight: 0.15, ...common, description: "关键元素坐标、宽高、间距对齐。" },
    ],
    structure: [
      { id: "dom-structure", name: "关键 DOM 结构", weight: 0.3, ...common, description: "关键 selector、列表、表单、导航结构匹配情况。" },
      { id: "control-semantics", name: "关键控件语义", weight: 0.25, ...common, description: "input、button、a、form 等控件是否真实可操作。" },
      { id: "basic-a11y-semantics", name: "基础语义一致性", weight: 0.2, ...common, description: "基础语义、焦点和可见文本是否合理。" },
      { id: "anti-cheat", name: "反截图伪页面检查", weight: 0.1, ...common, description: "是否存在整页截图、大面积 canvas 或不可交互伪装。" },
    ],
    content: [
      { id: "core-text-coverage", name: "核心文本覆盖", weight: 0.3, ...common, description: "标题、按钮、提示、结果等核心文本覆盖率。" },
      { id: "form-copy", name: "表单文案", weight: 0.2, ...common, description: "label、placeholder、helper text 是否一致。" },
      { id: "state-copy", name: "错误/空态/loading 文案", weight: 0.2, ...common, description: "状态文案是否与原站可见 UI 对齐。" },
      { id: "data-shape", name: "列表/表格/卡片数据结构", weight: 0.2, ...common, description: "结果项字段、数量和结构是否一致。" },
    ],
    engineering: [
      { id: "build-run-test", name: "构建/启动/测试", weight: 0.25, ...common, description: "复刻工程是否可构建、可启动、可评估。" },
      { id: "code-organization", name: "组件拆分与代码组织", weight: 0.2, ...common, description: "源码是否位于 project/page 并按组件、数据、状态、样式组织。" },
      { id: "style-isolation", name: "样式隔离与可维护性", weight: 0.15, ...common, description: "样式是否隔离、命名清晰、便于维护。" },
      { id: "artifact-completeness", name: "评估产物与日志完整性", weight: 0.2, ...common, description: "summary、details、report、截图、diff 等产物是否完整。" },
    ],
  };

  return byDimension[dimension];
}

export function buildSixDimensionalReport(
  report: EvaluationReport,
  options: { targets?: PageTarget[]; targetConfig?: string } = {},
): SixDimensionalEvaluationReport {
  const issues = report.pages
    .flatMap((page) => [...reportIssuesForPage(page), ...interactionIssuesForPage(page)])
    .sort((a, b) => b.priorityScore - a.priorityScore);
  const gateStatus = report.pages.every((page) => page.sourceValidation.canScore) ? "passed" : "failed";
  const scoredPages = report.pages.filter((page) => page.score);
  const totalScore = roundScore(average(scoredPages.map((page) => page.score?.totalScore ?? 0)));
  const issueCountByDimension = emptyDimensionCounts();
  const issueCountBySeverity = emptySeverityCounts();

  for (const issue of issues) {
    issueCountByDimension[issue.dimension] += 1;
    issueCountBySeverity[issue.severity] += 1;
  }

  const dimensionSummaries = Object.fromEntries(
    dimensions.map((dimension) => {
      const score = dimensionScore(report, dimension.id);
      return [
        dimension.id,
        {
          id: dimension.id,
          name: dimension.name,
          weight: dimension.weight,
          score,
          weightedContribution: roundScore(score * dimension.weight),
          status: statusForScore(score),
          issueCount: issueCountByDimension[dimension.id],
          topIssues: topIssuesForDimension(issues, dimension.id),
        },
      ];
    }),
  ) as Record<DimensionId, DimensionSummary>;
  const lowestDimension = dimensions
    .map((dimension) => dimensionSummaries[dimension.id])
    .sort((a, b) => a.score - b.score)[0];
  const stateCount = report.pages.reduce((total, page) => total + (page.stateResults?.length ?? 0), 0);
  const requiredStateCount = options.targets?.reduce(
    (total, target) => total + (target.states?.filter((state) => state.required !== false).length ?? 1) * (target.viewports.length || 1),
    0,
  ) ?? stateCount;
  const failedStateCount = report.pages.reduce(
    (total, page) => total + (page.stateResults?.filter((state) => state.status === "failed").length ?? 0),
    0,
  );

  const summary: SixDimensionalSummary = {
    schemaVersion: "2.0",
    totalScore,
    weightedScore: totalScore,
    conclusion: conclusionFor(totalScore, gateStatus),
    gateStatus,
    pageCount: report.pages.length,
    stateCount,
    requiredStateCount,
    failedStateCount,
    highRiskIssueCount: issues.filter((issue) => issue.severity === "blocker" || issue.severity === "error").length,
    lowestDimension: lowestDimension
      ? {
          id: lowestDimension.id,
          name: lowestDimension.name,
          score: lowestDimension.score,
        }
      : undefined,
    dimensions: dimensionSummaries,
    issueCountByDimension,
    issueCountBySeverity,
  };

  const pages: PageReport[] = report.pages.map((page) => {
    const target = options.targets?.find((item) => item.id === page.pageId);
    const pageIssues = issues.filter((issue) => issue.pageId === page.pageId);
    return {
      pageId: page.pageId,
      name: page.name,
      originalUrl: page.originalUrl,
      replicaUrl: page.replicaUrl,
      captureMode: captureModeFor(page),
      gateStatus: page.sourceValidation.canScore ? "passed" : "failed",
      finalUrl: page.sourceValidation.finalUrl || "",
      score: page.score
        ? {
            total: page.score.totalScore,
            level: page.score.level,
            metrics: page.score.metrics,
          }
        : undefined,
      states: (page.stateResults ?? []).map((state) => ({
        stateId: state.stateId,
        name: state.name,
        required: target?.states?.find((item) => item.id === state.stateId)?.required !== false,
        status: state.status,
        canScore: state.canScore,
        finalUrl: state.finalUrl,
        issues: state.issues.map((issue) => issue.message),
        score: page.score?.metrics,
      })),
      interactions: page.interactionResults ?? [],
      issues: pageIssues,
      artifacts: page.artifacts,
    };
  });

  const artifactIndex = buildArtifactIndex(report.pages);
  const dimensionReports: DimensionReport[] = dimensions.map((dimension) => ({
    ...dimensionSummaries[dimension.id],
    subMetrics: subMetricsForDimension(dimension.id, report),
    pageScores: pages.map((page) => ({
      pageId: page.pageId,
      pageName: page.name,
      score: page.score?.metrics[dimension.id] ?? 0,
      status: statusForScore(page.score?.metrics[dimension.id] ?? 0),
      worstStates: page.states.filter((state) => state.status === "failed").map((state) => state.stateId),
      topIssues: page.issues
        .filter((issue) => issue.dimension === dimension.id)
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 3)
        .map((issue) => issue.id),
    })),
    issues: issues.filter((issue) => issue.dimension === dimension.id),
    evidence: artifactIndex.byDimension[dimension.id],
    recommendation: recommendationForDimension(dimension.id, dimensionSummaries[dimension.id].score),
  }));

  return {
    schemaVersion: "2.0",
    run: {
      generatedAt: report.generatedAt,
      targetConfig: options.targetConfig ?? process.env.EVAL_TARGET_CONFIG ?? "未指定",
      browser: "Chromium",
      viewports: Array.from(new Set(options.targets?.flatMap((target) => target.viewports.map((viewport) => `${viewport.name} ${viewport.width}x${viewport.height}`)) ?? [])),
      pageCount: report.pages.length,
    },
    gates: report.pages.map((page) => ({
      id: `${page.pageId}-source-gate`,
      name: `${page.name} 原站基线与复刻可运行门禁`,
      status: page.sourceValidation.canScore ? "passed" : "failed",
      pageId: page.pageId,
      message: page.sourceValidation.issues.map((issue) => issue.message).join("；"),
    })),
    summary,
    dimensions: dimensionReports,
    pages,
    issues,
    artifacts: artifactIndex,
    history: {
      status: "unavailable",
      message: "当前版本尚未接入历史归档对比；报告保留六维历史对比入口。",
    },
  };
}
