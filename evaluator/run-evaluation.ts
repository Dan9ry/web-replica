import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateAntiCheatGate } from "./core/antiCheatGate.js";
import { evaluateReplicaConsistency } from "./core/evaluationMetrics.js";
import { latestEvaluationDirFor } from "./core/evaluationPaths.js";
import { writeJsonFile } from "./core/files.js";
import { runInteractionChecks } from "./core/interactionRunner.js";
import { loadTargets } from "./core/targets.js";
import type {
  EvaluationReport,
  PageEvaluationResult,
  StateCapture,
} from "./core/types.js";

const targets = await loadTargets();
const latestDir = latestEvaluationDirFor(targets[0]);
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

const report: EvaluationReport = {
  generatedAt: new Date().toISOString(),
  pages: await Promise.all(sourceValidation.pages.map(async (page) => {
    const target = targets.find((item) => item.id === page.pageId) ?? targets[0];
    if (!page.sourceValidation.canScore) {
      return page;
    }

    const captures = await readStateCaptures(page.pageId);
    const antiCheatGate = validateAntiCheatGate(target, captures.replica);
    if (!antiCheatGate.canScore) {
      return {
        ...page,
        sourceValidation: {
          ...page.sourceValidation,
          status: "failed",
          canScore: false,
          issues: [...page.sourceValidation.issues, ...antiCheatGate.issues],
        },
        issues: [...page.sourceValidation.issues, ...antiCheatGate.issues],
      };
    }

    const interactionResults = await runInteractionChecks({
      target,
      reportDir: latestDir,
    });
    const consistency = evaluateReplicaConsistency({
      target,
      originalCaptures: captures.original,
      replicaCaptures: captures.replica,
      interactionResults,
    });

    return {
      ...page,
      score: consistency.score,
      issues: [...page.sourceValidation.issues, ...consistency.issues],
      interactionResults: consistency.interactionResults,
      artifacts: {
        captures: {
          original: `${latestDir}/captures/${page.pageId}-source.json`,
          replica: `${latestDir}/captures/${page.pageId}-source.json`,
        },
        visualDiffs: captures.replica
          .filter((capture) => typeof capture.metrics?.screenshotDiffRatio === "number")
          .map(
            (capture) =>
              `${latestDir}/assets/${page.pageId}/${capture.stateId}/diff-${capture.viewport}.png`,
          ),
        regionDiffs: captures.replica.flatMap((capture) =>
          capture.metrics?.regionScores
            ?.map((region) => region.diffPath)
            .filter((path): path is string => Boolean(path)) ?? [],
        ),
      },
    };
  })),
};

await writeJsonFile(join(latestDir, "summary.json"), report);
console.log(`评估汇总已写入 ${join(latestDir, "summary.json")}。`);
