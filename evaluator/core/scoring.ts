import type { ScoreMetrics, WeightedScore } from "./types.js";

export const scoreWeights: ScoreMetrics = {
  functionality: 0.25,
  interaction: 0.2,
  visual: 0.25,
  structure: 0.1,
  content: 0.1,
  engineering: 0.1,
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
    structure: clampScore(metrics.structure),
    content: clampScore(metrics.content),
    engineering: clampScore(metrics.engineering),
  };

  const totalScore =
    normalized.functionality * scoreWeights.functionality +
    normalized.interaction * scoreWeights.interaction +
    normalized.visual * scoreWeights.visual +
    normalized.structure * scoreWeights.structure +
    normalized.content * scoreWeights.content +
    normalized.engineering * scoreWeights.engineering;

  const roundedTotal = Math.round(totalScore * 10) / 10;

  return {
    totalScore: roundedTotal,
    level: levelFor(roundedTotal),
    metrics: normalized,
  };
}
