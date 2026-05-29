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

  if (!targetFilter) {
    throw new Error("必须通过 EVAL_TARGET 指定当前复刻项目。评估器不支持评估全部页面。");
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

    return target.id === targetFilter;
  });
}
