# 06 — Spine 3.8.x / 3.8.75 Compatibility

## 1. Policy

Spine 3.8 is a first-class target family.
**3.8.75 is a mandatory exact-version golden target.**

Spine documents editor versions as `major.minor.patch` and runtime branches by major/minor. However, 3.8.75 deserves explicit handling because the official runtimes historically included a check rejecting exactly that export version due to known data concerns. LoongBones currently documents direct import support for Spine 3.8.75 plus atlas data.

## 2. Adapter layout

```text
format-spine-common/
format-spine-38/
  detector.ts
  schema.ts
  parser.ts
  normalizer.ts
  validator.ts
  repair-3875.ts
  exporter.ts
  capability.ts
```

No 3.8 logic belongs in `format-spine-42`.

## 3. Import modes

### STRICT
- schema errors stop import
- known 3.8.75 anomalies are errors
- no repairs

### COMPATIBLE
- recoverable anomalies become warnings
- normalization allowed
- no speculative correction

### REPAIR
- known deterministic repairs may be applied
- every repair is recorded
- original source bytes are never overwritten

## 4. 3.8.75 provenance

On detecting:

```json
"skeleton": { "spine": "3.8.75" }
```

store:
- exactVersion = `3.8.75`
- family = `3.8`
- profile = `spine-3.8.75`
- diagnostics reference
- SHA-256 of original JSON if available

## 5. Repair contract

A repair MUST:
- be deterministic;
- be separately unit tested;
- cite the known issue/reference in code comments/docs;
- preserve original value in diagnostic metadata;
- be opt-in through REPAIR mode unless impossible to load otherwise.

A repair MUST NOT:
- guess artistic intent;
- mutate source file;
- silently upgrade version;
- use proprietary runtime implementation code.

## 6. Core 3.8 fixture categories

- region attachment
- mesh
- weighted mesh
- linked mesh
- deform
- multiple skins
- skin attachment names differing from texture path
- clipping
- path
- bounding box
- IK 1-bone
- IK 2-bone
- IK with negative scale
- transform constraint
- path constraint
- draw order
- slot color
- two-color tint if present
- events
- stepped/linear/Bezier curves
- rotate crossing ±180°
- setup pose with reflection
- rotated atlas region
- whitespace/minified JSON
- omitted optional fields

## 7. Export target policy

Offer targets:
- `Spine 3.8 family compatible`
- `Spine 3.8.75 exact profile`

Default SHOULD be family-compatible stable behavior, not exact 3.8.75, unless project settings explicitly require exact 3.8.75.

Before export:
1. validate 3.8 capability set;
2. list unsupported canonical features;
3. offer bake/remove/cancel where applicable;
4. produce a conversion report.

## 8. Round-trip preservation

For 3.8 source:
- unknown harmless metadata may be preserved;
- rendering/behavior fields must normalize into canonical form;
- export does not need field ordering equality;
- behavior and source-target semantic equivalence are the acceptance criteria.

## 9. Explicit warning examples

- `SP38_3875_KNOWN_VERSION_RISK`
- `SP38_UNKNOWN_TRANSFORM_MODE`
- `SP38_LINKED_MESH_TARGET_MISSING`
- `SP38_DEFORM_VERTEX_COUNT_MISMATCH`
- `SP38_CURVE_INVALID`
- `SP38_ATLAS_REGION_MISSING`
- `SP38_EXPORT_FEATURE_NOT_SUPPORTED`

## 10. Key external references

- Spine versioning documentation
- Spine JSON export format
- Spine runtimes issue #2428
- LoongBones import documentation
