export type ValidationStatus = "passed" | "failed";

export type IssueSeverity = "error" | "warning" | "info";

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  weight?: number;
}

export interface PageTarget {
  id: string;
  name: string;
  originalUrl: string;
  replicaUrl: string;
  projectRoot?: string;
  baselineDir?: string;
  criticalSelectors: string[];
  viewports: ViewportConfig[];
  expectedTitleIncludes?: string[];
  expectedUrlIncludes?: string[];
  expectedTextIncludes?: string[];
  compareSelectors?: string[];
  pageWeight?: number;
  interactions?: InteractionCaseConfig[];
  masks?: MaskConfig[];
  antiCheatExceptions?: AntiCheatExceptionConfig[];
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
    }
  | {
      type: "hover";
      selector: string;
    }
  | {
      type: "focus";
      selector: string;
    }
  | {
      type: "blur";
      selector: string;
    }
  | {
      type: "check";
      selector: string;
    }
  | {
      type: "uncheck";
      selector: string;
    }
  | {
      type: "selectOption";
      selector: string;
      value: string;
    }
  | {
      type: "scroll";
      selector?: string;
      x?: number;
      y?: number;
    };

export type AssertionStep =
  | {
      type: "expectVisible" | "expectHidden" | "expectFocused" | "expectEnabled" | "expectDisabled";
      selector: string;
    }
  | {
      type: "expectTextIncludes" | "expectTextEquals" | "expectClassContains";
      selector: string;
      value: string;
    }
  | {
      type: "expectCount";
      selector: string;
      value?: number;
      min?: number;
      max?: number;
    }
  | {
      type: "expectValue" | "expectAttribute";
      selector: string;
      value: string;
      attribute?: string;
    }
  | {
      type: "expectUrlIncludes";
      value: string;
    };

export interface InteractionCaseConfig {
  id: string;
  name: string;
  weight?: number;
  sourceState?: string;
  targetState?: string;
  replicaUrl?: string;
  steps?: BrowserActionStep[];
  assertions?: AssertionStep[];
}

export interface RegionConfig {
  id: string;
  selector: string;
  weight?: number;
}

export interface MaskConfig {
  selector: string;
  reason: string;
}

export interface AntiCheatExceptionConfig {
  selector: string;
  reason: string;
  allowedAreaRatio?: number;
}

export interface PageStateConfig {
  id: string;
  name: string;
  required?: boolean;
  weight?: number;
  originalUrl?: string;
  replicaUrl?: string;
  originalSteps?: BrowserActionStep[];
  replicaSteps?: BrowserActionStep[];
  criticalSelectors?: string[];
  expectedTitleIncludes?: string[];
  expectedUrlIncludes?: string[];
  expectedTextIncludes?: string[];
  compareSelectors?: string[];
  expectations?: AssertionStep[];
  regions?: RegionConfig[];
  masks?: MaskConfig[];
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
  fromProjectBaseline?: boolean;
  baselinePath?: string;
  fallbackFromBaseline?: boolean;
  fallbackReason?: string;
}

export interface DomProfile {
  landmarks: Record<string, number>;
  textSample: string;
  textNodeLength?: number;
  imageAreaRatio?: number;
  canvasAreaRatio?: number;
  backgroundImageAreaRatio?: number;
  interactiveControlCount?: number;
  focusableControlCount?: number;
  base64ImageCount?: number;
  styles: Record<
    string,
    {
      fontSize?: string;
      color?: string;
      backgroundColor?: string;
      borderColor?: string;
      borderRadius?: string;
      width?: string;
      height?: string;
      x?: number;
      y?: number;
      display?: string;
      fontWeight?: string;
      lineHeight?: string;
    }
  >;
}

export interface CaptureMetrics {
  loadTimeMs?: number;
  screenshotDiffRatio?: number;
  ssim?: number;
  regionScores?: RegionVisualScore[];
  layoutScore?: number;
  styleScore?: number;
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
  structure: number;
  content: number;
  engineering: number;
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
  interactionResults?: InteractionCheckResult[];
  artifacts?: EvaluationArtifacts;
}

export interface EvaluationArtifacts {
  captures?: {
    original: string;
    replica: string;
  };
  visualDiffs?: string[];
  regionDiffs?: string[];
}

export interface InteractionCheckResult {
  id?: string;
  stateId: string;
  name: string;
  weight?: number;
  passed: boolean;
  failedStep?: number;
  type?: string;
  selector?: string;
  expected?: string | number;
  actual?: string | number;
  screenshot?: string;
  message?: string;
}

export interface RegionVisualScore {
  stateId: string;
  regionId: string;
  selector: string;
  weight: number;
  score: number;
  pixelScore: number;
  ssimScore: number;
  bboxScore: number;
  styleScore: number;
  diffRatio?: number;
  ssim?: number;
  originalPath?: string;
  replicaPath?: string;
  diffPath?: string;
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
