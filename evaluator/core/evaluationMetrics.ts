import { calculateWeightedScore } from "./scoring.js";
import type {
  ConsistencyEvaluationResult,
  InteractionCheckResult,
  ScoreMetrics,
  StateCapture,
  ValidationIssue,
} from "./types.js";

interface EvaluationInput {
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

function compareLandmarks(original: StateCapture, replica: StateCapture): number {
  const originalLandmarks = original.domProfile?.landmarks ?? {};
  const replicaLandmarks = replica.domProfile?.landmarks ?? {};
  const keys = new Set([
    ...Object.keys(originalLandmarks),
    ...Object.keys(replicaLandmarks),
  ]);

  if (keys.size === 0) {
    return 0;
  }

  const perKeyScores = [...keys].map((key) => {
    const expected = originalLandmarks[key] ?? 0;
    const actual = replicaLandmarks[key] ?? 0;

    if (expected === 0 && actual === 0) {
      return 100;
    }

    const denominator = Math.max(expected, actual, 1);
    return Math.max(0, 100 - (Math.abs(expected - actual) / denominator) * 100);
  });

  return average(perKeyScores);
}

function textCoverage(original: StateCapture, replica: StateCapture): number {
  const originalWords = new Set(
    (original.domProfile?.textSample || original.bodyTextSample)
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2),
  );
  const replicaText = replica.domProfile?.textSample || replica.bodyTextSample;

  if (originalWords.size === 0) {
    return 0;
  }

  const matched = [...originalWords].filter((word) => replicaText.includes(word));
  return (matched.length / originalWords.size) * 100;
}

function collectIssues(
  originalCaptures: StateCapture[],
  replicaByState: Map<string, StateCapture>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const original of originalCaptures) {
    if (!replicaByState.has(original.stateId)) {
      issues.push({
        severity: "error",
        code: "MISSING_REPLICA_STATE",
        message: `复刻页面缺少同名状态采集：${original.stateId}`,
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
        "视觉一致性偏低：请优先查看 reports/latest/assets 下对应状态的视觉差异图，修复页面整体布局、搜索框尺寸、结果页左右栏宽度、字体字号、间距和颜色。",
    });
  }

  if (metrics.interaction < 80) {
    issues.push({
      severity: "warning",
      code: "LOW_INTERACTION_SCORE",
      message:
        "交互一致性偏低：请运行复刻页交互用例，重点检查搜索提交、Enter 键、空输入反馈、分页按钮和状态切换是否与真实流程一致。",
    });
  }

  if (metrics.accessibility < 70) {
    issues.push({
      severity: "warning",
      code: "LOW_ACCESSIBILITY_SCORE",
      message:
        "结构/可访问性一致性偏低：请补齐 nav/main/form/list 等 landmark，确保输入框、按钮、分页和结果列表有稳定语义和可访问名称。",
    });
  }

  if (metrics.functionality < 90) {
    issues.push({
      severity: "warning",
      code: "LOW_FUNCTIONALITY_SCORE",
      message:
        "功能一致性偏低：请确认每个真实状态都有对应复刻状态，缺失状态会直接拉低功能分。",
    });
  }
}

export function evaluateReplicaConsistency({
  originalCaptures,
  replicaCaptures,
  interactionResults,
}: EvaluationInput): ConsistencyEvaluationResult {
  const replicaByState = new Map(
    replicaCaptures.map((capture) => [capture.stateId, capture]),
  );
  const matchedPairs = originalCaptures
    .map((original) => ({
      original,
      replica: replicaByState.get(original.stateId),
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
  const passedInteractions = interactionResults.filter((result) => result.passed).length;
  const interactionScore =
    interactionResults.length === 0
      ? stateCompleteness
      : (passedInteractions / interactionResults.length) * 100;

  const visualScores = matchedPairs.map(({ replica }) => {
    const diffScore =
      typeof replica.metrics?.screenshotDiffRatio === "number"
        ? scoreFromDiffRatio(replica.metrics.screenshotDiffRatio)
        : 0;
    const ssimScore =
      typeof replica.metrics?.ssim === "number"
        ? scoreFromSsim(replica.metrics.ssim)
        : diffScore;

    return diffScore * 0.55 + ssimScore * 0.45;
  });

  const structureScores = matchedPairs.map(
    ({ original, replica }) =>
      compareLandmarks(original, replica) * 0.65 + textCoverage(original, replica) * 0.35,
  );

  const metrics: ScoreMetrics = {
    functionality: stateCompleteness,
    interaction: interactionScore,
    visual: Math.round(average(visualScores) * 10) / 10,
    accessibility: Math.round(average(structureScores) * 10) / 10,
  };
  addLowScoreSuggestions(metrics, issues);

  return {
    score: calculateWeightedScore(metrics),
    metrics,
    issues,
    interactionResults,
  };
}
