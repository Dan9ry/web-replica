import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { calculateWeightedScore } from "./core/scoring.js";
import { writeJsonFile } from "./core/files.js";
import type { EvaluationReport, PageEvaluationResult } from "./core/types.js";

const latestDir = join(process.cwd(), "reports", "latest");
const sourceValidation = JSON.parse(
  await readFile(join(latestDir, "source-validation.json"), "utf8"),
) as { pages: PageEvaluationResult[] };

const report: EvaluationReport = {
  generatedAt: new Date().toISOString(),
  pages: sourceValidation.pages.map((page) => {
    if (!page.sourceValidation.canScore) {
      return page;
    }

    return {
      ...page,
      score: calculateWeightedScore({
        functionality: 0,
        interaction: 0,
        visual: 0,
        performance: 0,
        accessibility: 0,
        responsive: 0,
      }),
      issues: [
        {
          severity: "info",
          code: "REPLICA_METRICS_NOT_IMPLEMENTED",
          message: "原网页门禁已通过，复刻页面分项指标将在后续步骤接入。",
        },
      ],
    };
  }),
};

await writeJsonFile(join(latestDir, "summary.json"), report);
console.log("评估汇总已写入 reports/latest/summary.json。");

