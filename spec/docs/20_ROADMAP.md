# 20 — Implementation Roadmap

## Phase 0 — Specification and corpus

Deliver:
- canonical types
- schemas
- feature matrix
- transform convention
- compatibility adapters skeleton
- source corpus policy
- 3.8.75 fixtures
- CI

Exit: model can represent mandatory V1 entities without format-specific leakage.

## Phase 1 — Runtime proof

Deliver:
- math
- skeleton instance
- region attachments
- bone transforms
- animation translate/rotate/scale/shear
- Pixi renderer
- DragonBones basic import
- Spine 3.8 basic import

Exit: same simple character renders from DB and Spine through one runtime.

## Phase 2 — Mesh/skin/deform

Deliver:
- mesh
- weights
- skins
- deform
- atlas handling
- clipping
- draw order

Exit: golden fixtures pass for SP38/DB.

## Phase 3 — Constraints

Deliver:
- IK
- transform constraint
- path/path constraint
- ordering semantics
- negative scale regression set

Exit: numerical pose golden tests pass.

## Phase 4 — Editor foundation

Deliver:
- Tauri/web shell
- docking
- hierarchy
- stage
- inspector
- command bus
- undo/redo
- save/autosave

## Phase 5 — Animation authoring

Deliver:
- timeline
- key editing
- graph editor
- curves
- playback
- event editing

## Phase 6 — Mesh/weight authoring

Deliver:
- mesh editor
- triangulation
- binding
- weight brush
- heatmap
- lasso/soft selection

## Phase 7 — Export compatibility

Deliver:
- Spine 3.8 exporter
- exact 3.8.75 profile
- DragonBones exporter
- reports
- round-trip suite

## Phase 8 — Spine 4.2

Deliver:
- 4.2 importer/exporter subset
- physics canonical model
- clean-room solver
- bake-to-keyframes

## Phase 9 — Production hardening

- performance
- crash recovery
- packaging
- update
- accessibility
- docs
- license/SBOM
- plugin API

## Milestone naming

M0 Spec
M1 Viewer
M2 Character Runtime
M3 Constraints
M4 Editor Alpha
M5 Animator Alpha
M6 Rigging Beta
M7 Compatibility Beta
M8 Production Candidate


## Implementation Readiness Gate

Before Phase 1 coding is considered underway, confirm:
- docs 25–34 reviewed;
- docs 35–43 present;
- transform convention accepted;
- runtime evaluation order accepted;
- Spine 3.8.75 fixture policy accepted;
- clean-room boundary accepted;
- AI work packages assigned by package ownership.

## Authoritative detailed phase plans

- P0: `45_PHASE_0_SPEC_AND_CORPUS.md`
- P1: `46_PHASE_1_RUNTIME_POC.md`
- P2: `47_PHASE_2_MESH_SKIN_DEFORM.md`
- P3: `48_PHASE_3_CONSTRAINTS.md`
- P4: `49_PHASE_4_EDITOR_FOUNDATION.md`
- P5: `50_PHASE_5_ANIMATION_AUTHORING.md`
- P6: `51_PHASE_6_MESH_WEIGHT_AUTHORING.md`
- P7: `52_PHASE_7_EXPORT_COMPATIBILITY.md`
- P8: `53_PHASE_8_SPINE42_PHYSICS.md`
- P9: `54_PHASE_9_PRODUCTION_HARDENING.md`

The master execution plan is `44_MASTER_EXECUTION_PLAN.md`.
