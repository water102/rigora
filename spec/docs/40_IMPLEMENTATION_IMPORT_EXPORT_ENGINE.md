# 40 — Implementation Spec: Generic Import / Export Engine

---

## 1. Goal

Keep format-specific code local while sharing:
- file acquisition;
- version routing;
- diagnostics;
- repair orchestration;
- asset resolution;
- reporting;
- capability validation.

---

## 2. Core interfaces

```ts
interface FormatDetector {
  id: string;
  detect(input: ImportSource): DetectionResult;
}

interface ImportAdapter<TAst> {
  parse(source: ImportSource, ctx: ImportContext): Promise<TAst>;
  validateSource(ast: TAst, ctx: ImportContext): Diagnostic[];
  repair?(ast: TAst, ctx: ImportContext): RepairResult<TAst>;
  normalize(ast: TAst, ctx: ImportContext): HnnProject;
}

interface ExportAdapter<TTargetAst> {
  capabilities: TargetCapabilities;
  plan(project: HnnProject, ctx: ExportContext): ExportPlan;
  toTarget(project: HnnProject, plan: ExportPlan, ctx: ExportContext): TTargetAst;
  validateTarget(ast: TTargetAst, ctx: ExportContext): Diagnostic[];
  serialize(ast: TTargetAst, ctx: ExportContext): Uint8Array;
}
```

---

## 3. Detection

Detection priority:
1. container extension hints
2. content signature
3. format metadata/version
4. schema clues

Never trust file extension alone.

If ambiguous:
- return candidates with confidence;
- require explicit choice when risk is high.

---

## 4. Import orchestrator

Pseudo:

```ts
async function importProject(source, options) {
  const detection = detectFormat(source);

  if (!detection.best) {
    return fatal("FORMAT_UNKNOWN");
  }

  const adapter = registry.resolveImporter(detection.best);

  const ast = await adapter.parse(source, ctx);
  diagnostics.add(adapter.validateSource(ast, ctx));

  if (diagnostics.hasFatal()) return fail();

  let workingAst = ast;

  if (options.mode === "repair" && adapter.repair) {
    const rr = adapter.repair(ast, ctx);
    workingAst = rr.ast;
    diagnostics.add(rr.diagnostics);
    report.repairs.push(...rr.audit);
  }

  const project = adapter.normalize(workingAst, ctx);

  diagnostics.add(validateCanonical(project));

  const assets = await assetResolver.resolve(project, source, options);
  diagnostics.add(assets.diagnostics);

  return {
    project,
    diagnostics,
    report
  };
}
```

---

## 5. Import transactionality

Do not partially replace the current open project while import is still validating.

Import into temporary model.
Only commit into editor after:
- no fatal errors;
- user accepts warnings/repair report when required.

---

## 6. Asset resolver chain

Resolvers:

```text
BundledContainerResolver
 -> AtlasRelativeResolver
 -> SourceDirectoryResolver
 -> UserSearchRootResolver
 -> MissingAssetResolver
```

Each returns:
- found
- not found
- ambiguous

Ambiguous same-name assets must not be auto-selected silently.

---

## 7. Export planning

Before target AST:

```ts
interface ExportIssue {
  featureId: string;
  entityId?: Id;
  resolutionOptions: ExportResolution[];
}

interface ExportPlan {
  target: string;
  issues: ExportIssue[];
  chosenResolutions: Record<string, ExportResolution>;
}
```

No exporter writes bytes until blocking issues are resolved.

---

## 8. Capability scanning

Do not merely check project-level flags.

Walk actual entities:
- physics constraint exists?
- linked mesh feature used?
- two-color tint used?
- native custom extension affects output?
- nested skeleton used?

Generate entity-level issue list.

---

## 9. Bake integration

Export planner can request tools:

```text
BakePhysics
BakeUnsupportedConstraint
FlattenNestedSkeleton
ReduceInfluences
```

Each bake:
- creates a temporary export projection by default;
- does not mutate original project unless user explicitly applies it.

---

## 10. Serializer determinism

Rules:
- fixed property order
- deterministic entity arrays
- deterministic float formatting
- stable newline policy
- explicit UTF-8

Optional pretty/minified setting must not affect semantics.

---

## 11. Source preservation

Store original source outside canonical behavior data when user chooses:

```text
provenance/
  original.json
  import-report.json
```

Useful for audits and debugging.

---

## 12. Error containment

Parser errors must include:
- line/column when available
- JSON pointer/entity when semantic
- format/version
- stable diagnostic code

Never throw raw third-party exceptions directly to UI.

Wrap them.

---

## 13. Streaming

V1 JSON can parse whole file in memory.
For very large files:
- investigate worker parse
- streaming JSON only if real corpus requires it

Do not complicate V1 prematurely.

---

## 14. Security

ZIP/native:
- reject `../`
- normalize paths
- limit file count
- limit uncompressed size
- limit individual image dimensions
- never execute bundled scripts

JSON:
- size limits
- recursion/depth guard if custom parser used
- prototype pollution-safe object handling

---

## 15. Test scenarios

- valid exact version
- missing version
- unknown version
- malformed JSON
- valid JSON wrong schema
- missing image
- ambiguous image
- repair mode
- strict rejection
- export capability block
- export bake
- deterministic repeated export
