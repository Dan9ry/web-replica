import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { evaluateReplicaConsistency } from "./core/evaluationMetrics.js";
import { writeJsonFile } from "./core/files.js";
import type {
  EvaluationReport,
  InteractionCheckResult,
  PageEvaluationResult,
  StateCapture,
} from "./core/types.js";

const latestDir = join(process.cwd(), "reports", "latest");
const sourceValidation = JSON.parse(
  await readFile(join(latestDir, "source-validation.json"), "utf8"),
) as { pages: PageEvaluationResult[] };

async function readStateCaptures(
  pageId: string,
): Promise<{ original: StateCapture[]; replica: StateCapture[] }> {
  return JSON.parse(
    await readFile(join(latestDir, "captures", `${pageId}-source.json`), "utf8"),
  ) as { original: StateCapture[]; replica: StateCapture[] };
}

function buildInteractionResults(replicaCaptures: StateCapture[]): InteractionCheckResult[] {
  return replicaCaptures.map((capture) => ({
    stateId: capture.stateId,
    name: `${capture.stateId} 状态采集`,
    passed: !capture.error && Boolean(capture.screenshot) && capture.screenshot?.blank !== true,
    message: capture.error,
  }));
}

const report: EvaluationReport = {
  generatedAt: new Date().toISOString(),
  pages: await Promise.all(sourceValidation.pages.map(async (page) => {
    if (!page.sourceValidation.canScore) {
      return page;
    }

    const captures = await readStateCaptures(page.pageId);
    const consistency = evaluateReplicaConsistency({
      originalCaptures: captures.original,
      replicaCaptures: captures.replica,
      interactionResults: buildInteractionResults(captures.replica),
    });

    return {
      ...page,
      score: consistency.score,
      issues: consistency.issues,
      artifacts: {
        captures: {
          original: `reports/latest/captures/${page.pageId}-source.json`,
          replica: `reports/latest/captures/${page.pageId}-source.json`,
        },
        visualDiffs: captures.replica
          .filter((capture) => typeof capture.metrics?.screenshotDiffRatio === "number")
          .map(
            (capture) =>
              `reports/latest/assets/${page.pageId}/${capture.stateId}/diff-${capture.viewport}.png`,
          ),
      },
    };
  })),
};

await writeJsonFile(join(latestDir, "summary.json"), report);
console.log("评估汇总已写入 reports/latest/summary.json。");
