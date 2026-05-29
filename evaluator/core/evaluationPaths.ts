import { join } from "node:path";
import type { PageTarget } from "./types.js";

export function projectRootFor(target: PageTarget): string {
  return target.projectRoot ?? join(process.cwd(), "projects", target.id);
}

export function evaluationRootFor(target: PageTarget): string {
  return join(projectRootFor(target), "evaluation");
}

export function latestEvaluationDirFor(target: PageTarget): string {
  return join(evaluationRootFor(target), "latest");
}

export function historyEvaluationDirFor(target: PageTarget, timestamp: string): string {
  return join(evaluationRootFor(target), "history", timestamp);
}
