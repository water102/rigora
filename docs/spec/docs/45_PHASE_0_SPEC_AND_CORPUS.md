# 45 — Phase 0: Specification, Corpus and Engineering Foundation

## Goal
Remove high-cost ambiguity before feature implementation.

## Entry
- product direction accepted;
- Spine 3.8.75, Spine 4.2 and DragonBones are confirmed targets;
- clean-room policy accepted.

## Workstream A — Repository

### P0-A01 Workspace
Create pnpm workspace:
```text
apps/
packages/
tests/
tools/
```
Acceptance:
- clean install;
- package-local build;
- no circular dependencies.

### P0-A02 TypeScript
- strict mode;
- shared base config;
- declaration output for library packages;
- no implicit any.

### P0-A03 Lint/format
- consistent formatting;
- forbidden dependency rules;
- unused/dead-code checks.

### P0-A04 Tests
Install Vitest and baseline test utilities.

### P0-A05 CI
Required pipeline:
- install
- typecheck
- lint
- unit
- fixtures
- build

## Workstream B — Canonical model

### P0-B01 Math types
Vec2, Mat2D, Transform2D, colors and unit conventions.

### P0-B02 Domain types
Implement doc 03:
- Skeleton
- Bone
- Slot
- Skin
- Attachment union
- Constraints
- Animation
- Timeline
- Event
- Provenance

### P0-B03 Validators
Use Zod or equivalent at I/O boundaries.

### P0-B04 IDs
Persist stable IDs; names are display/export identifiers only.

### P0-B05 Invariants
Validate:
- acyclic hierarchy;
- unique IDs;
- valid references;
- finite numerics;
- valid triangle indices;
- valid weights;
- linked-mesh cycle absence.

## Workstream C — Diagnostics
Implement:
- Diagnostic
- Collector
- code registry
- JSON/Markdown report
- source pointer support

## Workstream D — Corpus

Create synthetic distributable fixtures.

Spine 3.8.75:
- region
- parent transform
- reflection
- mesh
- weighted mesh
- linked mesh
- deform
- skin
- clipping
- path
- IK
- transform constraint
- path constraint
- draw order
- events
- curves
- rotated atlas
- known 3.8.75 repair case

DragonBones:
equivalent minimal corpus.

Spine 4.2:
parser smoke corpus plus physics examples for P8.

Every fixture README records:
- feature;
- source version;
- provenance;
- expected behavior;
- license.

## Workstream E — Oracle framework
Implement:
- canonical snapshot;
- pose snapshot;
- matrix diff;
- bone-tip position/angle diff;
- mesh RMS/max vertex diff;
- expected diagnostics matcher.

## Workstream F — License/dependencies
Create live ledger:
- package/version
- repo
- license
- use
- wrapper
- modification status.

## Parallel work
Safe:
- repository;
- diagnostics;
- fixture preparation;
- dependency audit.

Single-owner:
- canonical model;
- coordinate/transform convention.

## Exit gate
- [ ] canonical model independent of Pixi/React/Tauri
- [ ] transform convention locked
- [ ] model validators operational
- [ ] diagnostics operational
- [ ] corpus directories created
- [ ] exact 3.8.75 profile policy documented
- [ ] clean-room rules in repo
- [ ] CI green
- [ ] no unresolved critical license blocker
- [ ] first numeric diff test passes

## Explicit non-goals
Do not build production editor, full renderer, exporter or physics here.

## Handoff
Deliver F0 frozen contracts plus fixture catalog to P1.
