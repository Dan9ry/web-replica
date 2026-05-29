import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { latestEvaluationDirFor } from "../core/evaluationPaths.js";
import { buildMarkdownReport } from "../core/report.js";
import { writeTextFile } from "../core/files.js";
import { loadTargets } from "../core/targets.js";
import type { EvaluationReport } from "../core/types.js";

const targets = await loadTargets();
const latestDir = latestEvaluationDirFor(targets[0]);
const summary = JSON.parse(
  await readFile(join(latestDir, "summary.json"), "utf8"),
) as EvaluationReport;
const markdown = buildMarkdownReport(summary);

await writeTextFile(join(latestDir, "report.md"), markdown);
await writeTextFile(
  join(latestDir, "index.html"),
  `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>一致性评估报告</title>
    <style>
      body { max-width: 960px; margin: 40px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.7; color: #202124; }
      pre { white-space: pre-wrap; padding: 20px; background: #f7f8fb; border: 1px solid #dfe3ea; border-radius: 8px; }
    </style>
  </head>
  <body>
    <pre>${markdown.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>
  </body>
</html>
`,
);

console.log(`评估报告已写入 ${join(latestDir, "report.md")} 和 ${join(latestDir, "index.html")}。`);
