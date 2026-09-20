export type DiagnosticSeverity = "info" | "warning" | "error" | "fatal";

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  sourcePath?: string;
  jsonPointer?: string;
  entityId?: string;
  suggestedAction?: string;
  details?: unknown;
}
