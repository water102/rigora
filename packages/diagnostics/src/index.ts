/** Compatible with spec/spec/diagnostic.ts; codes are stable report identifiers. */
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

export const diagnosticCodes = {
  CORE_CYCLIC_BONE_HIERARCHY: "Bone hierarchy contains a cycle.",
  CORE_WEIGHT_SUM_INVALID: "Vertex influence weights must sum to one.",
  CORE_DUPLICATE_INFLUENCE: "A vertex must not repeat an influence bone.",
  CORE_DEGENERATE_TRIANGLE:
    "Triangle indices and geometry must form a nonzero area.",
  DB60_UNSUPPORTED_FEATURE:
    "DragonBones 6.0 extension is recognized but unsupported.",
  DB60_UNSUPPORTED_VERSION:
    "DragonBones 6.0 requires a dedicated normalization profile.",
  CORE_INVALID_REFERENCE: "An entity reference cannot be resolved.",
  CORE_DUPLICATE_ID: "Stable entity IDs must be unique.",
  CORE_NON_FINITE_NUMBER: "Numeric values must be finite.",
  SP38_3875_KNOWN_VERSION_RISK:
    "Exact Spine 3.8.75 compatibility requires golden verification.",
} as const;

export interface DiagnosticReport {
  diagnostics: Diagnostic[];
  counts: Record<DiagnosticSeverity, number>;
  hasErrors: boolean;
}

/** Owns its data: callers cannot mutate a collected report through shared references. */
export class DiagnosticCollector {
  readonly #items: Diagnostic[] = [];

  add(diagnostic: Diagnostic): void {
    this.#items.push(structuredClone(diagnostic));
  }

  get hasErrors(): boolean {
    return this.#items.some(
      (item) => item.severity === "error" || item.severity === "fatal",
    );
  }

  report(): DiagnosticReport {
    const counts = { info: 0, warning: 0, error: 0, fatal: 0 };
    for (const item of this.#items) counts[item.severity]++;
    return {
      diagnostics: structuredClone(this.#items),
      counts,
      hasErrors: this.hasErrors,
    };
  }

  toJSON(): string {
    return JSON.stringify(this.report(), null, 2);
  }

  toMarkdown(): string {
    const report = this.report();
    const lines = [
      "# Diagnostics",
      "",
      `Info: ${report.counts.info}; warnings: ${report.counts.warning}; errors: ${report.counts.error}; fatal: ${report.counts.fatal}.`,
      "",
    ];
    for (const item of report.diagnostics) {
      lines.push(
        `- **${item.severity.toUpperCase()} ${escapeMarkdown(item.code)}**: ${escapeMarkdown(item.message)}`,
      );
      if (item.sourcePath !== undefined)
        lines.push(`  Source: ${escapeMarkdown(item.sourcePath)}`);
      if (item.jsonPointer !== undefined)
        lines.push(`  JSON pointer: ${escapeMarkdown(item.jsonPointer)}`);
      if (item.entityId !== undefined)
        lines.push(`  Entity: ${escapeMarkdown(item.entityId)}`);
      if (item.suggestedAction !== undefined)
        lines.push(`  Action: ${escapeMarkdown(item.suggestedAction)}`);
    }
    return lines.join("\n") + "\n";
  }
}

function escapeMarkdown(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_{}\[\]()#+.!|~-])/g, "\\$1")
    .replace(/[\r\n]+/g, " ");
}
