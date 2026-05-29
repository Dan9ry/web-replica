import { describe, expect, test } from "vitest";
import { calculateWeightedScore } from "../../evaluator/core/scoring";

describe("calculateWeightedScore", () => {
  test("returns a weighted total score and human-readable level", () => {
    const result = calculateWeightedScore({
      functionality: 100,
      interaction: 90,
      visual: 80,
      performance: 100,
      accessibility: 90,
      responsive: 80,
    });

    expect(result.totalScore).toBe(89.5);
    expect(result.level).toBe("基本一致");
  });

  test("clamps invalid metric values to the 0-100 range", () => {
    const result = calculateWeightedScore({
      functionality: 120,
      interaction: -20,
      visual: 50,
      performance: 100,
      accessibility: 100,
      responsive: 100,
    });

    expect(result.metrics.functionality).toBe(100);
    expect(result.metrics.interaction).toBe(0);
    expect(result.totalScore).toBe(62.5);
  });
});

