import { calculateWeightedScore } from "./scoring.js";
import { normalizeTargetStates } from "./stateValidation.js";
import type {
  ConsistencyEvaluationResult,
  InteractionCheckResult,
  PageTarget,
  PageStateConfig,
  ScoreMetrics,
  StateCapture,
  StructureSelectorConfig,
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

function countCoverageScore(actual: number, expected: number): number {
  if (expected <= 0) {
    return actual === 0 ? 100 : 85;
  }

  if (actual <= expected) {
    return Math.max(0, Math.min(100, (actual / expected) * 100));
  }

  // Extra scoped elements are less harmful than missing requested elements.
  return Math.max(75, 100 - ((actual - expected) / Math.max(expected, 1)) * 25);
}

function rangedCountScore(actual: number, min: number, max: number): number {
  if (actual >= min && actual <= max) {
    return 100;
  }

  if (actual < min) {
    return countCoverageScore(actual, min);
  }

  return Math.max(75, 100 - ((actual - max) / Math.max(max, 1)) * 25);
}

function countWithToleranceScore(actual: number, expected: number, tolerance: number): number {
  const min = Math.max(0, expected - tolerance);
  const max = expected + tolerance;
  return rangedCountScore(actual, min, max);
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

function configuredStructureSelectors(
  target: PageTarget,
  state: PageStateConfig | undefined,
): StructureSelectorConfig[] {
  const configured = state?.structureSelectors ?? target.structureSelectors;
  if (configured && configured.length > 0) {
    return configured;
  }

  const selectors = state?.compareSelectors ??
    state?.criticalSelectors ??
    target.compareSelectors ??
    target.criticalSelectors;

  return Array.from(new Set(selectors)).map((selector) => ({
    selector,
    purpose: inferSelectorPurpose(selector),
  }));
}

function inferSelectorPurpose(selector: string): StructureSelectorConfig["purpose"] {
  if (/^body$|footer|header|logo|avatar|account|apps|copyright/i.test(selector)) {
    return "visual";
  }

  if (/input|textarea|select|button|form|\[role=['"]?(button|textbox|search|form)/i.test(selector)) {
    return "functional";
  }

  if (/result|list|item|card|table|pagination|pager|search/i.test(selector)) {
    return "structural";
  }

  if (/^a$|link|\[role=['"]?link/i.test(selector)) {
    return "visual";
  }

  return "structural";
}

function structureSelectorWeight(config: StructureSelectorConfig): number {
  if (typeof config.weight === "number") {
    return config.weight;
  }

  if (config.purpose === "functional") {
    return 3;
  }

  if (config.purpose === "structural" || config.purpose === "content") {
    return 1.5;
  }

  return 0.5;
}

function selectorStructureScore(
  original: StateCapture,
  replica: StateCapture,
  selectors: StructureSelectorConfig[],
): number {
  return weightedAverage(
    selectors,
    (config) => {
      const originalCount = original.selectors[config.selector]?.visibleCount ??
        original.selectors[config.selector]?.count ??
        0;
      const replicaCount = replica.selectors[config.selector]?.visibleCount ??
        replica.selectors[config.selector]?.count ??
        0;

      if (typeof config.minCount === "number" || typeof config.maxCount === "number") {
        const min = config.minCount ?? config.expectedCount ?? originalCount;
        const max = config.maxCount ?? config.expectedCount ?? originalCount;
        return rangedCountScore(replicaCount, min, max);
      }

      if (typeof config.expectedCount === "number") {
        return countWithToleranceScore(replicaCount, config.expectedCount, config.tolerance ?? 0);
      }

      if (config.required === false && replicaCount === 0) {
        return 100;
      }

      return countWithToleranceScore(replicaCount, originalCount, config.tolerance ?? Math.ceil(originalCount * 0.15));
    },
    structureSelectorWeight,
  );
}

function structureScoreFor(
  target: PageTarget,
  state: PageStateConfig | undefined,
  original: StateCapture,
  replica: StateCapture,
): number {
  const originalLandmarks = original.domProfile?.landmarks ?? {};
  const replicaLandmarks = replica.domProfile?.landmarks ?? {};
  const structureSelectors = configuredStructureSelectors(target, state);
  const scopedSelectorScore = selectorStructureScore(original, replica, structureSelectors);
  const landmarkKeys = ["nav", "main", "form", "list", "listitem"];
  const landmarkScore = average(landmarkKeys.map((key) => {
    const originalCount = originalLandmarks[key] ?? 0;
    const replicaCount = replicaLandmarks[key] ?? 0;
    return countWithToleranceScore(replicaCount, originalCount, Math.ceil(originalCount * 0.25));
  }));
  const controlSelectors = structureSelectors.filter((config) =>
    config.interactionRequired !== false &&
    config.purpose !== "visual" &&
    config.purpose !== "content" &&
    (
      config.purpose === "functional" ||
      /button|input|textarea|select|a\b|\[role=['"]?(button|textbox|link)/.test(config.selector)
    ),
  );
  const scopedExpectedControls = controlSelectors.reduce((total, config) => {
    if (typeof config.expectedCount === "number") {
      return total + config.expectedCount;
    }
    if (typeof config.minCount === "number") {
      return total + config.minCount;
    }
    return total + (original.selectors[config.selector]?.visibleCount ?? original.selectors[config.selector]?.count ?? 0);
  }, 0);
  const scopedReplicaControls = controlSelectors.reduce(
    (total, config) => total + (replica.selectors[config.selector]?.visibleCount ?? replica.selectors[config.selector]?.count ?? 0),
    0,
  );
  const controlScore = controlSelectors.length > 0
    ? countCoverageScore(scopedReplicaControls, scopedExpectedControls)
    : scopedSelectorScore;
  const replicaControls = replica.domProfile?.interactiveControlCount ??
    ((replicaLandmarks.button ?? 0) + (replicaLandmarks.input ?? 0) + (replicaLandmarks.link ?? 0));
  const focusScore = replicaControls > 0
    ? Math.min(100, ((replica.domProfile?.focusableControlCount ?? replicaControls) / replicaControls) * 100)
    : 100;
  const textScore = (replica.domProfile?.textNodeLength ?? replica.bodyTextSample.length) > 0 ? 100 : 0;

  return scopedSelectorScore * 0.8 + landmarkScore * 0.1 + controlScore * 0.04 + focusScore * 0.03 + textScore * 0.03;
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
  const statesById = new Map(normalizeTargetStates(target).map((state) => [state.id, state]));
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
    structure: Math.round(average(matchedPairs.map(({ original, replica }) =>
      structureScoreFor(target, statesById.get(original.stateId), original, replica),
    )) * 10) / 10,
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
