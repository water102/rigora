# 09 — Import / Export Pipeline

## 1. Import stages

```text
bytes
 -> detect container
 -> parse syntax
 -> detect format/version
 -> schema validation
 -> source AST
 -> semantic validation
 -> version normalization
 -> optional repair
 -> canonical model
 -> canonical validation
 -> asset resolution
 -> import report
```

Never parse directly into live runtime objects.

## 2. Source AST

Each adapter has a source-specific typed AST.
This enables:
- better diagnostics;
- exact source references;
- controlled repair;
- unit tests independent from canonical model.

## 3. Diagnostics include locations

```ts
interface Diagnostic {
  code: string;
  severity: "info" | "warning" | "error" | "fatal";
  message: string;
  sourcePath?: string;
  jsonPointer?: string;
  entityId?: string;
  suggestedAction?: string;
  details?: JsonValue;
}
```

## 4. Asset resolution

Resolution order:
1. explicitly bundled asset mapping
2. source atlas
3. project-relative images path
4. user-provided search roots
5. unresolved diagnostic

Never silently bind a same-named texture from an unrelated folder.

## 5. Export stages

```text
canonical model
 -> target capability validation
 -> downgrade planner
 -> user decisions/bakes
 -> target AST
 -> target semantic validation
 -> serialize
 -> optional atlas/package
 -> export report
```

## 6. Loss plan

```ts
type ExportResolution =
  | "native"
  | "convert"
  | "bake"
  | "drop-with-approval"
  | "block";
```

Every non-native conversion appears in the report.

## 7. Round-trip modes

### Semantic round-trip
Source -> HNN -> source family; compare behavior.

### Native round-trip
HNN -> .hbone -> HNN; must be lossless.

### Cross-format
Spine -> HNN -> DragonBones; expected controlled losses.

## 8. Determinism

Given same project + export settings:
- serialized semantic data must be deterministic;
- stable ordering is required;
- floating formatting is configurable and stable;
- asset packing seed/order is stable.
