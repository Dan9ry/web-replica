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
}

export interface ScoreMetrics {
  functionality: number;
  interaction: number;
  visual: number;
  performance: number;
  accessibility: number;
  responsive: number;
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
}

export interface EvaluationReport {
  generatedAt: string;
  pages: PageEvaluationResult[];
}

