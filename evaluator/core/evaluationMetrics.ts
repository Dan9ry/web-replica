import { calculateWeightedScore } from "./scoring.js";
import type {
  ConsistencyEvaluationResult,
  InteractionCheckResult,
  PageTarget,
  ScoreMetrics,
  StateCapture,
  ValidationIssue,
} from "./types.js";

interface EvaluationInput {
  target: PageTarget;
  originalCaptures: StateCapture[];
  replicaCaptures: StateCapture[];
  interactionResults: InteractionCheckResult[];
}

function average(values: number[]): number {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (finiteValues.length === 0) {
    return 0;
  }

  return finiteValues.reduce((total, value) => total + value, 0) / finiteValues.length;
}

function scoreFromDiffRatio(diffRatio: number): number {
  return Math.max(0, Math.min(100, 100 - diffRatio * 100));
}

function scoreFromSsim(ssim: number): number {
  return Math.max(0, Math.min(100, ssim * 100));
}

function captureKey(capture: StateCapture): string {
  return `${capture.stateId}::${capture.viewport}`;
}

function weightedAverage<T>(
  values: T[],
  scoreFor: (value: T) => number,
  weightFor: (value: T) => number = () => 1,
): number {
  const weighted = values
    .map((value) => ({ score: scoreFor(value), weight: Math.max(0, weightFor(value)) }))
    .filter(({ score, weight }) => Number.isFinite(score) && weight > 0);

  if (weighted.length === 0) {
    return 0;
  }

  const totalWeight = weighted.reduce((total, value) => total + value.weight, 0);
  return weighted.reduce((total, value) => total + value.score * value.weight, 0) / totalWeight;
}

function normalizedText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function similarityRatio(a: number, b: number): number {
  if (a === 0 && b === 0) {
    return 100;
  }

  const max = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.max(0, 100 - (Math.abs(a - b) / max) * 100);
}

function expectedTextCoverage(target: PageTarget, captures: StateCapture[]): number {
  const expected = target.expectedTextIncludes ?? [];
  if (expected.length === 0) {
    return captures.some((capture) => capture.bodyTextSample.trim().length > 0) ? 100 : 0;
  }

  const haystack = normalizedText(captures.map((capture) => capture.bodyTextSample).join("\n"));
  const matched = expected.filter((text) => haystack.includes(normalizedText(text))).length;
  return (matched / expected.length) * 100;
}

function collectIssues(
  originalCaptures: StateCapture[],
  replicaByState: Map<string, StateCapture>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const original of originalCaptures) {
    if (!replicaByState.has(captureKey(original))) {
      issues.push({
        severity: "error",
        code: "MISSING_REPLICA_STATE",
        message: `复刻页面缺少同名状态采集：${original.stateId} / ${original.viewport}`,
      });
    }
  }

  return issues;
}

function addLowScoreSuggestions(metrics: ScoreMetrics, issues: ValidationIssue[]): void {
  if (metrics.visual < 80) {
    issues.push({
      severity: "warning",
      code: "LOW_VISUAL_SCORE",
      message:
        "视觉一致性偏低：请优先查看当前 project/evaluation/latest/assets 下对应状态的视觉差异图，修复区域布局、字体字号、间距、颜色和控件尺寸。",
    });
  }

  if (metrics.interaction < 80) {
    issues.push({
      severity: "warning",
      code: "LOW_INTERACTION_SCORE",
      message:
        "交互流程一致性偏低：请查看交互用例失败步骤，重点检查点击、输入、Enter、焦点、即时反馈、分页和状态切换。",
    });
  }

  if (metrics.functionality < 90) {
    issues.push({
      severity: "warning",
      code: "LOW_FUNCTIONALITY_SCORE",
      message:
        "功能正确性偏低：请确认 required states、核心功能断言、输出结果和边界/异常态都已实现。",
    });
  }

  if (metrics.structure < 80) {
    issues.push({
      severity: "warning",
      code: "LOW_STRUCTURE_SCORE",
      message:
        "结构/语义一致性偏低：请检查核心文本是否在 DOM 中，input/button/a/form/list/pagination 是否是真实可聚焦、可操作的网页元素。",
    });
  }

  if (metrics.content < 80) {
    issues.push({
      severity: "warning",
      code: "LOW_CONTENT_SCORE",
      message:
        "内容/数据一致性偏低：请补齐按钮文案、输入框 placeholder、结果项标题/摘要、错误提示、分页数字等用户可见文本。",
    });
  }

  if (metrics.engineering < 80) {
    issues.push({
      severity: "warning",
      code: "LOW_ENGINEERING_SCORE",
      message:
        "工程可维护性偏低：请确认项目可构建、源码位于当前 project/page 下、组件/数据/状态/样式拆分清晰，且没有投机实现。",
    });
  }
}

function structureScoreFor(original: StateCapture, replica: StateCapture): number {
  const originalLandmarks = original.domProfile?.landmarks ?? {};
  const replicaLandmarks = replica.domProfile?.landmarks ?? {};
  const landmarkKeys = ["nav", "main", "form", "button", "link", "input", "list", "listitem"];
  const landmarkScore = average(
    landmarkKeys.map((key) => similarityRatio(originalLandmarks[key] ?? 0, replicaLandmarks[key] ?? 0)),
  );
  const originalControls =
    original.domProfile?.interactiveControlCount ??
    ((originalLandmarks.button ?? 0) + (originalLandmarks.input ?? 0));
  const replicaControls =
    replica.domProfile?.interactiveControlCount ??
    ((replicaLandmarks.button ?? 0) + (replicaLandmarks.input ?? 0));
  const controlScore = similarityRatio(originalControls, replicaControls);
  const focusScore = replicaControls > 0
    ? Math.min(100, ((replica.domProfile?.focusableControlCount ?? 0) / replicaControls) * 100)
    : 100;
  const textScore = (replica.domProfile?.textNodeLength ?? replica.bodyTextSample.length) > 0 ? 100 : 0;

  return landmarkScore * 0.35 + controlScore * 0.25 + focusScore * 0.2 + textScore * 0.2;
}

function visualScoreFor(replica: StateCapture): number {
  const diffScore =
    typeof replica.metrics?.screenshotDiffRatio === "number"
      ? scoreFromDiffRatio(replica.metrics.screenshotDiffRatio)
      : 0;
  const ssimScore =
    typeof replica.metrics?.ssim === "number"
      ? scoreFromSsim(replica.metrics.ssim)
      : diffScore;
  const fullPageScore = diffScore * 0.55 + ssimScore * 0.45;
  const regionScore = average(replica.metrics?.regionScores?.map((region) => region.score) ?? []);
  const layoutScore = replica.metrics?.layoutScore ?? fullPageScore;
  const styleScore = replica.metrics?.styleScore ?? fullPageScore;

  if (regionScore > 0) {
    return regionScore * 0.45 + fullPageScore * 0.15 + layoutScore * 0.2 + styleScore * 0.15 + 5;
  }

  return fullPageScore * 0.75 + layoutScore * 0.15 + styleScore * 0.1;
}

export function evaluateReplicaConsistency({
  target,
  originalCaptures,
  replicaCaptures,
  interactionResults,
}: EvaluationInput): ConsistencyEvaluationResult {
  const replicaByState = new Map(
    replicaCaptures.map((capture) => [captureKey(capture), capture]),
  );
  const matchedPairs = originalCaptures
    .map((original) => ({
      original,
      replica: replicaByState.get(captureKey(original)),
    }))
    .filter(
      (pair): pair is { original: StateCapture; replica: StateCapture } =>
        Boolean(pair.replica),
    );

  const issues = collectIssues(originalCaptures, replicaByState);
  const stateCompleteness =
    originalCaptures.length === 0
      ? 0
      : (matchedPairs.length / originalCaptures.length) * 100;
  const interactionScore =
    interactionResults.length === 0
      ? stateCompleteness
      : weightedAverage(
          interactionResults,
          (result) => (result.passed ? 100 : 0),
          (result) => result.weight ?? 1,
        );

  const contentScore =
    expectedTextCoverage(target, replicaCaptures) * 0.55 +
    average(
      matchedPairs.map(({ original, replica }) =>
        similarityRatio(original.bodyTextSample.length, replica.bodyTextSample.length),
      ),
    ) * 0.25 +
    stateCompleteness * 0.2;
  const boundaryCases = interactionResults.filter((result) =>
    /empty|error|invalid|validation|边界|异常|错误|空/.test(`${result.id ?? ""} ${result.name}`),
  );
  const boundaryScore =
    boundaryCases.length === 0
      ? interactionScore
      : weightedAverage(
          boundaryCases,
          (result) => (result.passed ? 100 : 0),
          (result) => result.weight ?? 1,
        );
  const functionalityScore =
    stateCompleteness * 0.25 +
    interactionScore * 0.35 +
    contentScore * 0.2 +
    boundaryScore * 0.2;
  const runtimeScore = replicaCaptures.every((capture) => !capture.error && !capture.screenshot?.blank)
    ? 100
    : 0;
  const organizationScore = target.projectRoot?.includes(`/projects/${target.id}`) ||
    target.projectRoot?.endsWith(`projects/${target.id}`)
    ? 100
    : 80;
  const evidenceScore = target.states && target.states.length > 0 ? 100 : 70;
  const engineeringScore = runtimeScore * 0.4 + organizationScore * 0.3 + evidenceScore * 0.3;

  const metrics: ScoreMetrics = {
    functionality: Math.round(functionalityScore * 10) / 10,
    interaction: Math.round(interactionScore * 10) / 10,
    visual: Math.round(average(matchedPairs.map(({ replica }) => visualScoreFor(replica))) * 10) / 10,
    structure: Math.round(average(matchedPairs.map(({ original, replica }) => structureScoreFor(original, replica))) * 10) / 10,
    content: Math.round(contentScore * 10) / 10,
    engineering: Math.round(engineeringScore * 10) / 10,
  };
  addLowScoreSuggestions(metrics, issues);

  return {
    score: calculateWeightedScore(metrics),
    metrics,
    issues,
    interactionResults,
  };
}
