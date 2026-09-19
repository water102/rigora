# 24 — Open Questions / Decisions to Lock Before Beta

These do not block Phase 0/1 unless marked CRITICAL.

## CRITICAL

### A. Exact output requirement for Spine 3.8.75
Do consumers require:
- version string exactly 3.8.75?
- family-compatible 3.8 JSON?
- visual/runtime behavior only?

Default assumption: support exact profile as an option, family-compatible target as default.

### B. Native coordinate system
Recommendation: mathematical Y-up canonical; Pixi adapter converts screen Y.

### C. Physics scope
Recommendation: canonical schema in V1, full authoring/solver staged.

## Important

- Product/project final name and extensions
- macOS/Linux release priority
- plugin sandbox model
- whether runtime package must be framework-free ESM
- whether Phaser adapter is V1 or later
- embedded texture atlas format
- audio support scope
- localization
- maximum project size requirement
- exact target browsers
- whether headless CLI is part of first public release

## Deferred

- collaboration
- cloud storage
- marketplace/plugins
- Live2D/Spriter formats
- binary compression format
