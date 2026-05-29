export type ValidationStatus = "passed" | "failed";

export type IssueSeverity = "error" | "warning" | "info";

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

export interface PageTarget {
  id: string;
  name: string;
  originalUrl: string;
  replicaUrl: string;
  criticalSelectors: string[];
  viewports: ViewportConfig[];
  expectedTitleIncludes?: string[];
  expectedUrlIncludes?: string[];
  expectedTextIncludes?: string[];
  states?: PageStateConfig[];
}

export type CaptureSide = "original" | "replica";

export type BrowserActionStep =
  | {
      type: "fill";
      selector: string;
      value: string;
    }
  | {
      type: "click";
      selector: string;
    }
  | {
      type: "press";
      selector: string;
      key: string;
    }
  | {
      type: "waitForSelector";
      selector: string;
      timeoutMs?: number;
    }
  | {
      type: "waitForURLIncludes";
      value: string;
      timeoutMs?: number;
    }
  | {
      type: "wait";
      ms: number;
    };

export interface PageStateConfig {
  id: string;
  name: string;
  required?: boolean;
  originalUrl?: string;
  replicaUrl?: string;
  originalSteps?: BrowserActionStep[];
  replicaSteps?: BrowserActionStep[];
  criticalSelectors?: string[];
  expectedTitleIncludes?: string[];
  expectedUrlIncludes?: string[];
  expectedTextIncludes?: string[];
  compareSelectors?: string[];
}

export interface SelectorCapture {
  count: number;
  visibleCount: number;
}

export interface ScreenshotCapture {
  width: number;
  height: number;
  blank: boolean;
}

export interface SourceCapture {
  requestedUrl: string;
  finalUrl: string;
  status: number | null;
  title: string;
  bodyTextSample: string;
  screenshotPath?: string;
  screenshot?: ScreenshotCapture;
  selectors: Record<string, SelectorCapture>;
  error?: string;
  manualVerified?: boolean;
  fallbackFromBaseline?: boolean;
  fallbackReason?: string;
}

export interface DomProfile {
  landmarks: Record<string, number>;
  textSample: string;
  styles: Record<
    string,
    {
      fontSize?: string;
      color?: string;
      backgroundColor?: string;
      borderRadius?: string;
      width?: string;
      height?: string;
    }
  >;
}

export interface CaptureMetrics {
  loadTimeMs?: number;
  screenshotDiffRatio?: number;
  ssim?: number;
}

export interface StateCapture extends SourceCapture {
  stateId: string;
  side: CaptureSide;
  viewport: string;
  domProfile?: DomProfile;
  metrics?: CaptureMetrics;
}

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
}

export interface SourceValidationResult {
  status: ValidationStatus;
  canScore: boolean;
  finalUrl: string;
  issues: ValidationIssue[];
  captureMode?: "live" | "baseline";
  stateResults?: StateValidationResult[];
}

export interface StateValidationResult {
  stateId: string;
  name: string;
  status: ValidationStatus;
  canScore: boolean;
  finalUrl: string;
  issues: ValidationIssue[];
  captureMode?: "live" | "baseline";
}

export interface ScoreMetrics {
  functionality: number;
  interaction: number;
  visual: number;
}

export interface WeightedScore {
  totalScore: number;
  level: string;
  metrics: ScoreMetrics;
}

export interface PageEvaluationResult {
  pageId: string;
  name: string;
  originalUrl: string;
  replicaUrl: string;
  sourceValidation: SourceValidationResult;
  score?: WeightedScore;
  issues?: ValidationIssue[];
  stateResults?: StateValidationResult[];
  artifacts?: EvaluationArtifacts;
}

export interface EvaluationArtifacts {
  captures?: {
    original: string;
    replica: string;
  };
  visualDiffs?: string[];
}

export interface InteractionCheckResult {
  stateId: string;
  name: string;
  passed: boolean;
  message?: string;
}

export interface ConsistencyEvaluationResult {
  score: WeightedScore;
  metrics: ScoreMetrics;
  issues: ValidationIssue[];
  interactionResults: InteractionCheckResult[];
}

export interface EvaluationReport {
  generatedAt: string;
  pages: PageEvaluationResult[];
}
