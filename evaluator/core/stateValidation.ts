import { validateSourceCapture } from "./sourceValidation.js";
import type {
  PageStateConfig,
  PageTarget,
  SourceValidationResult,
  StateCapture,
  StateValidationResult,
  ValidationIssue,
} from "./types.js";

export function normalizeTargetStates(target: PageTarget): PageStateConfig[] {
  if (target.states && target.states.length > 0) {
    return target.states.map((state) => ({
      required: true,
      ...state,
      criticalSelectors: state.criticalSelectors ?? target.criticalSelectors,
      expectedTitleIncludes:
        state.expectedTitleIncludes ?? target.expectedTitleIncludes,
      expectedUrlIncludes: state.expectedUrlIncludes ?? target.expectedUrlIncludes,
      expectedTextIncludes:
        state.expectedTextIncludes ?? target.expectedTextIncludes,
    }));
  }

  return [
    {
      id: "home",
      name: "入口初始态",
      required: true,
      criticalSelectors: target.criticalSelectors,
      expectedTitleIncludes: target.expectedTitleIncludes,
      expectedUrlIncludes: target.expectedUrlIncludes,
      expectedTextIncludes: target.expectedTextIncludes,
    },
  ];
}

function missingStateIssue(state: PageStateConfig): ValidationIssue {
  return {
    severity: "error",
    code: "MISSING_STATE_CAPTURE",
    message: `必需真实状态未采集或未落盘：${state.id}（${state.name}）`,
  };
}

export function validateStateCapture(
  target: PageTarget,
  state: PageStateConfig,
  capture: StateCapture,
): StateValidationResult {
  const stateTarget: PageTarget = {
    ...target,
    criticalSelectors: state.criticalSelectors ?? target.criticalSelectors,
    expectedTitleIncludes:
      state.expectedTitleIncludes ?? target.expectedTitleIncludes,
    expectedUrlIncludes: state.expectedUrlIncludes ?? target.expectedUrlIncludes,
    expectedTextIncludes:
      state.expectedTextIncludes ?? target.expectedTextIncludes,
  };
  const result = validateSourceCapture(stateTarget, capture);

  return {
    stateId: state.id,
    name: state.name,
    status: result.status,
    canScore: result.canScore,
    finalUrl: result.finalUrl,
    issues: result.issues,
    captureMode: result.captureMode,
  };
}

export function validateTargetStateCaptures(
  target: PageTarget,
  captures: StateCapture[],
): SourceValidationResult {
  const states = normalizeTargetStates(target);
  const stateResults: StateValidationResult[] = [];
  const issues: ValidationIssue[] = [];

  for (const state of states) {
    const capture = captures.find((item) => item.stateId === state.id);

    if (!capture) {
      const issue = missingStateIssue(state);
      issues.push(issue);
      stateResults.push({
        stateId: state.id,
        name: state.name,
        status: "failed",
        canScore: false,
        finalUrl: "",
        issues: [issue],
      });
      continue;
    }

    const stateResult = validateStateCapture(target, state, capture);
    stateResults.push(stateResult);
    issues.push(...stateResult.issues);
  }

  const hasError = stateResults.some((state) => !state.canScore);
  const captureMode = stateResults.some((state) => state.captureMode === "baseline")
    ? "baseline"
    : "live";

  return {
    status: hasError ? "failed" : "passed",
    canScore: !hasError,
    finalUrl: stateResults[0]?.finalUrl ?? "",
    issues,
    captureMode,
    stateResults,
  };
}
