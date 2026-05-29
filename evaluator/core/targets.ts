import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PageTarget } from "./types.js";

interface RawTarget extends PageTarget {
  expectedTitleIncludes?: string[];
  expectedUrlIncludes?: string[];
  expectedTextIncludes?: string[];
}

const targetFiles = ["baidu.json", "wechat-pay-login.json", "third-page.json"];

export async function loadTargets(rootDir = process.cwd()): Promise<PageTarget[]> {
  const targetFilter = process.env.EVAL_TARGET?.trim();
  const evaluateAll = process.env.EVAL_ALL === "1";

  if (!targetFilter && !evaluateAll) {
    throw new Error("必须通过 EVAL_TARGET 指定页面，或通过 EVAL_ALL=1 明确评估全部页面。");
  }

  const targets = await Promise.all(
    targetFiles.map(async (fileName) => {
      const filePath = join(rootDir, "evaluator", "targets", fileName);
      const raw = JSON.parse(await readFile(filePath, "utf8")) as RawTarget;
      return raw;
    }),
  );

  return targets.filter((target) => {
    if (target.originalUrl.trim().length === 0) {
      return false;
    }

    if (evaluateAll) {
      return true;
    }

    return target.id === targetFilter;
  });
}
