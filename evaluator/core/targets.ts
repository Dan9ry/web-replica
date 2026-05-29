import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import type { PageTarget } from "./types.js";

interface RawTarget extends PageTarget {
  expectedTitleIncludes?: string[];
  expectedUrlIncludes?: string[];
  expectedTextIncludes?: string[];
}

export async function loadTargets(rootDir = process.cwd()): Promise<PageTarget[]> {
  const targetConfig = process.env.EVAL_TARGET_CONFIG?.trim();

  if (!targetConfig) {
    throw new Error(
      "必须通过 EVAL_TARGET_CONFIG 指定当前复刻项目配置，例如 projects/{target-id}/config/target.json。",
    );
  }

  const filePath = isAbsolute(targetConfig) ? targetConfig : join(rootDir, targetConfig);
  const target = JSON.parse(await readFile(filePath, "utf8")) as RawTarget;

  if (target.originalUrl.trim().length === 0) {
    throw new Error(`当前复刻项目配置缺少 originalUrl：${filePath}`);
  }

  return [target];
}
