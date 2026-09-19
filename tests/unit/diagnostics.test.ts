import { describe, expect, it } from "vitest";
import { DiagnosticCollector } from "../../packages/diagnostics/src/index.js";

describe("diagnostic reports", () => {
  it("counts severities without treating warnings as blocking", () => {
    const collector = new DiagnosticCollector();
    collector.add({
      code: "TEST_WARNING",
      severity: "warning",
      message: "Warning",
    });
    expect(collector.hasErrors).toBe(false);
    collector.add({
      code: "CORE_INVALID_REFERENCE",
      severity: "fatal",
      message: "Missing bone",
      jsonPointer: "/slots/0/boneId",
    });
    expect(JSON.parse(collector.toJSON())).toEqual({
      diagnostics: collector.report().diagnostics,
      counts: { info: 0, warning: 1, error: 0, fatal: 1 },
      hasErrors: true,
    });
  });

  it("retains source locations and escapes source text in Markdown", () => {
    const collector = new DiagnosticCollector();
    collector.add({
      code: "CORE_INVALID_REFERENCE",
      severity: "error",
      message: "<script>bad</script>",
      sourcePath: "fixture.json",
      jsonPointer: "/slots/0",
      entityId: "slot:1",
      suggestedAction: "Select a bone",
    });
    const markdown = collector.toMarkdown();
    expect(markdown).toContain("&lt;script&gt;bad&lt;/script&gt;");
    expect(markdown).toContain("/slots/0");
    expect(markdown).toContain("Select a bone");
  });

  it("isolates nested input and report data and emits deterministic JSON", () => {
    const collector = new DiagnosticCollector();
    const details = { ids: ["original"] };
    collector.add({
      code: "CORE_DUPLICATE_ID",
      severity: "error",
      message: "Duplicate",
      details,
    });
    const before = collector.toJSON();
    details.ids.push("mutated");
    collector.report().diagnostics.splice(0);
    expect(collector.toJSON()).toBe(before);
  });
});
