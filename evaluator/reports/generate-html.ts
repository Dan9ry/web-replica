import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { latestEvaluationDirFor } from "../core/evaluationPaths.js";
import { buildHtmlReport, buildMarkdownReport } from "../core/report.js";
import { writeTextFile } from "../core/files.js";
import { loadTargets } from "../core/targets.js";
import type { SixDimensionalEvaluationReport } from "../core/reportModel.js";
import type { EvaluationReport } from "../core/types.js";

const targets = await loadTargets();
const latestDir = latestEvaluationDirFor(targets[0]);
const report = JSON.parse(
  await readFile(join(latestDir, "details.json"), "utf8").catch(() =>
    readFile(join(latestDir, "summary.json"), "utf8"),
  ),
) as EvaluationReport | SixDimensionalEvaluationReport;
const markdown = buildMarkdownReport(report);
const html = buildHtmlReport(report);

await writeTextFile(join(latestDir, "report.md"), markdown);
await writeTextFile(join(latestDir, "index.html"), html);

console.log(`评估报告已写入 ${join(latestDir, "report.md")} 和 ${join(latestDir, "index.html")}。`);
