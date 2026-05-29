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

  const loadScores = matchedPairs.map(({ original, replica }) => {
    const originalLoad = original.metrics?.loadTimeMs ?? 0;
    const replicaLoad = replica.metrics?.loadTimeMs ?? originalLoad;

    if (originalLoad <= 0 || replicaLoad <= 0) {
      return 80;
    }

    return Math.max(0, Math.min(100, 100 - Math.max(0, replicaLoad - originalLoad) / 20));
  });

  const metrics: ScoreMetrics = {
    functionality: stateCompleteness,
    interaction: interactionScore,
    visual: Math.round(average(visualScores) * 10) / 10,
    performance: Math.round(average(loadScores) * 10) / 10,
    accessibility: Math.round(average(structureScores) * 10) / 10,
    responsive: stateCompleteness,
  };

  return {
    score: calculateWeightedScore(metrics),
    metrics,
    issues,
    interactionResults,
  };
}
