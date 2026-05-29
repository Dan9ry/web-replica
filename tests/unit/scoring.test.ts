import { describe, expect, test } from "vitest";
import { calculateWeightedScore } from "../../evaluator/core/scoring";

describe("calculateWeightedScore", () => {
  test("returns a weighted total score and human-readable level", () => {
    const result = calculateWeightedScore({
      functionality: 100,
      interaction: 90,
      visual: 80,
      structure: 70,
      content: 60,
      engineering: 50,
    });

    expect(result.totalScore).toBe(81);
    expect(result.level).toBe("基本一致");
  });

  test("clamps invalid metric values to the 0-100 range", () => {
    const result = calculateWeightedScore({
      functionality: 120,
      interaction: -20,
      visual: 50,
      structure: Number.NaN,
      content: 80,
      engineering: 1000,
    });

    expect(result.metrics.functionality).toBe(100);
    expect(result.metrics.interaction).toBe(0);
    expect(result.metrics.engineering).toBe(100);
    expect(result.totalScore).toBe(55.5);
  });
});
