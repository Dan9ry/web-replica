import type { ScoreMetrics, WeightedScore } from "./types.js";

const weights: ScoreMetrics = {
  functionality: 0.3,
  interaction: 0.2,
  visual: 0.35,
  performance: 0.05,
  accessibility: 0.05,
  responsive: 0.05,
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function levelFor(totalScore: number): string {
  if (totalScore >= 90) {
    return "高一致";
  }

  if (totalScore >= 80) {
    return "基本一致";
  }

  if (totalScore >= 70) {
    return "可运行但需修复";
  }

  return "不建议提交验收";
}

export function calculateWeightedScore(metrics: ScoreMetrics): WeightedScore {
  const normalized: ScoreMetrics = {
    functionality: clampScore(metrics.functionality),
    interaction: clampScore(metrics.interaction),
    visual: clampScore(metrics.visual),
    performance: clampScore(metrics.performance),
    accessibility: clampScore(metrics.accessibility),
    responsive: clampScore(metrics.responsive),
  };

  const totalScore =
    normalized.functionality * weights.functionality +
    normalized.interaction * weights.interaction +
    normalized.visual * weights.visual +
    normalized.performance * weights.performance +
    normalized.accessibility * weights.accessibility +
    normalized.responsive * weights.responsive;

  const roundedTotal = Math.round(totalScore * 10) / 10;

  return {
    totalScore: roundedTotal,
    level: levelFor(roundedTotal),
    metrics: normalized,
  };
}

