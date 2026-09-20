# 19 — Diagnostics, Errors and Warnings

## 1. Severity

- INFO
- WARNING
- ERROR
- FATAL

## 2. Prefixes

- `CORE_`
- `NATIVE_`
- `SP38_`
- `SP42_`
- `DB55_`
- `ATLAS_`
- `ASSET_`
- `EXPORT_`
- `RUNTIME_`
- `EDITOR_`

## 3. Rules

Diagnostics must be:
- stable codes;
- human readable;
- machine readable;
- source-locatable where possible;
- actionable.

## 4. Examples

`SP38_3875_KNOWN_VERSION_RISK`
`SP38_IK_REPAIR_APPLIED`
`SP42_PHYSICS_BAKE_REQUIRED`
`DB55_ROTATED_ATLAS_SEMANTIC_MISMATCH`
`ASSET_TEXTURE_NOT_FOUND`
`EXPORT_FEATURE_DROPPED`
`CORE_CYCLIC_BONE_HIERARCHY`
`CORE_WEIGHT_SUM_INVALID`

## 5. Import report

Summary:
- source format/version
- entities imported
- repairs
- warnings
- errors
- unresolved assets

## 6. Export report

Summary:
- target format/version
- native features
- converted features
- baked features
- dropped features
- blocked features

Reports can be saved as JSON and Markdown.

## 7. No silent fallback

Fallback must produce at least INFO if behavior changes; WARNING if data/behavior may differ.
