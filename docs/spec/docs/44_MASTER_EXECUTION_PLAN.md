# 44 — Master Execution Plan

This is the program-level execution contract for HNN Bones. It connects product scope, architecture, algorithms, compatibility requirements, testing, agent workflow and release qualification into one plan.

## 1. End state

The first major release must provide:
- a format-neutral canonical skeletal-animation model;
- a deterministic runtime independent of Spine, DragonBones, React, Pixi and Tauri;
- Spine 3.8.x import/export, with Spine 3.8.75 as an explicit mandatory golden target;
- Spine 4.2 import/export for the documented supported subset;
- DragonBones 5.5-compatible import/export;
- PixiJS 8 runtime rendering;
- a web/desktop editor with hierarchy, stage, inspector, timeline, graph editor, mesh editing, weight painting, constraints, skins, diagnostics and export planning;
- native HNN project format;
- undo/redo, macro and AI authoring through one command API;
- deterministic compatibility fixtures and release gates.

## 2. Phase map

| Phase | Name | Primary outcome |
|---|---|---|
| P0 | Specification & Corpus | stable contracts, corpus, CI |
| P1 | Runtime Proof | Spine 3.8 + DragonBones render through one runtime |
| P2 | Mesh / Skin / Deform | production-capable mesh playback |
| P3 | Constraints | IK, transform/path constraints and ordering |
| P4 | Editor Foundation | project lifecycle and basic authoring shell |
| P5 | Animation Authoring | timeline, graph and animation editing |
| P6 | Mesh / Weight Authoring | complete rigging and mesh tools |
| P7 | Export Compatibility | controlled Spine 3.8/DB exports |
| P8 | Spine 4.2 & Physics | 4.2 deltas, clean-room physics and downgrade |
| P9 | Production Hardening | release candidate quality |

## 3. Critical path

```text
Canonical Model
  -> Transform Semantics
  -> Animation Evaluation
  -> Spine 3.8 Parser/Normalizer
  -> Mesh/Weights/Deform
  -> Constraint Ordering/Solvers
  -> Spine 3.8.75 Golden Suite
  -> Export Planner
  -> Spine 3.8 Export
  -> Spine 4.2 Delta Layer
  -> Physics/Bake
  -> Release Qualification
```

UI work may proceed around the critical path only when its consumed interfaces are frozen.

## 4. Global execution rules

1. Correctness before polish.
2. Canonical model before external-format convenience.
3. Every source version is isolated in an adapter.
4. Every persistent editor change uses Command.
5. No silent import/export loss.
6. Every compatibility bug gets a minimized regression fixture.
7. Numeric pose/geometry comparison is authoritative; screenshot comparison is supplementary.
8. Heavy optimization follows profiling.
9. Third-party libraries are wrapped behind HNN interfaces.
10. No official Spine runtime implementation code is copied into HNN.

## 5. Global Definition of Ready

A task may enter implementation only when:
- its owning package is named;
- required interfaces are known;
- upstream dependency is available or stubbed;
- relevant architecture/algorithm document is named;
- required fixture exists or fixture creation is part of the task;
- acceptance criteria are measurable;
- expected diagnostics are known;
- dependency/license status is acceptable;
- no unresolved semantic decision blocks it.

## 6. Global Definition of Done

A task is complete only when:
- implementation compiles and typechecks;
- unit and fixture tests pass;
- public contract is documented;
- no forbidden package dependency is introduced;
- compatibility matrix is updated if applicable;
- diagnostics are implemented;
- no unreviewed dependency is added;
- performance impact is measured when on a hot path;
- task report lists limitations and follow-ups.

## 7. Milestones

- M0 Specification Ready — after P0
- M1 Dual-format Viewer — after P1
- M2 Character Runtime — after P2
- M3 Constraint Runtime — after P3
- M4 Editor Alpha — after P4
- M5 Animator Alpha — after P5
- M6 Rigging Beta — after P6
- M7 Compatibility Beta — after P7
- M8 Spine 4.2/Physics Beta — after P8
- M9 Release Candidate — after P9

## 8. Freeze points

### F0 after P0
Freeze:
- canonical identity/reference principles;
- coordinate convention;
- transform representation;
- diagnostics shape.

### F1 after P1
Freeze:
- runtime pose interface;
- animation channel contract;
- renderer snapshot contract.

### F2 after P2
Freeze:
- mesh/weight/deform semantics;
- attachment runtime contract.

### F3 after P3
Freeze:
- constraint interface;
- evaluation order.

### F4 after P4
Freeze:
- command API principles;
- project repository abstraction;
- native project persistence boundaries.

Breaking a freeze requires ADR + migration/compatibility analysis.

## 9. Phase dependency map

```text
P0
 |
 v
P1 ------------------> P4 shell work may start after F1
 |
 v
P2
 |
 v
P3
 | \____________________
 |                      \
 v                       v
P5 <-------------------- P4
 |
 v
P6
 |
 v
P7
 |
 v
P8
 |
 v
P9
```

P5 requires P1 + P4.
P6 requires P2 + P4.
P7 requires stable P2 + P3 and enough P5/P6 data creation to exercise export.
P8 deliberately follows a stable 3.8/DragonBones baseline.

## 10. Stop conditions

Pause feature expansion when any is true:
- canonical schema changes frequently;
- transform goldens are unstable;
- Spine 3.8.75 mandatory fixtures fail;
- exporter loses behavior without reporting;
- editor mutation bypasses command bus;
- licensing of a dependency is unclear;
- editor preview runtime differs from exported runtime semantics.

Fix foundation before continuing.

## 11. Program completion criteria

Release candidate requires:
- all P0–P9 exit gates green;
- full mandatory Spine 3.8.75 corpus passing;
- supported Spine 4.2 corpus passing;
- DragonBones corpus passing;
- native round-trip lossless;
- export reports disclose every conversion/bake/drop;
- performance report published;
- migration and crash-recovery tests passing;
- desktop packaging qualified;
- SBOM/third-party notices complete;
- end-user and developer documentation complete.
