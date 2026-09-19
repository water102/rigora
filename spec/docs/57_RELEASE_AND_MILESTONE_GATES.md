# 57 — Milestone and Release Gates

## M0 Specification Ready
Must have:
- model;
- transform convention;
- diagnostics;
- fixture corpus structure;
- CI;
- clean-room/license policy.

## M1 Dual-format Viewer
Must have:
- Spine 3.8.75 basic import;
- DragonBones basic import;
- one canonical runtime;
- Pixi region renderer;
- transform/curve goldens.

## M2 Character Runtime
Must have:
- mesh;
- weights;
- linked mesh;
- deform;
- skins;
- clipping;
- performance baseline.

## M3 Constraint Runtime
Must have:
- one/two bone IK;
- reflection cases;
- transform constraint;
- path/path constraint;
- ordered debug snapshots.

## M4 Editor Alpha
Must have:
- native project;
- open/save;
- hierarchy;
- stage;
- inspector;
- undo/redo;
- autosave baseline.

## M5 Animator Alpha
Must have:
- timeline;
- graph;
- key editing;
- events;
- attachment/color/draw-order;
- constraint animation.

## M6 Rigging Beta
Must have:
- mesh editing;
- binding;
- weight painting;
- auto mesh baseline;
- auto weight baseline;
- deform authoring;
- path authoring.

## M7 Compatibility Beta
Must have:
- capability planner;
- Spine 3.8 export;
- 3.8.75 exact profile;
- DragonBones export;
- round-trip suites;
- export reports.

## M8 Spine 4.2/Physics Beta
Must have:
- documented 4.2 subset;
- physics source mapping;
- deterministic solver;
- bake/downgrade;
- 3.8 regression unchanged.

## M9 Release Candidate
Must have:
- all suites green;
- recovery;
- migrations;
- packaging;
- performance report;
- SBOM/notices;
- user/developer docs.

## Severity
Critical:
- data loss
- corrupted project
- silent wrong export
- deterministic crash in normal workflow
- license blocker

Critical always blocks milestone.

High:
- major compatibility divergence
- unusable core workflow
- severe performance regression

Normally blocks.

Medium/Low may ship alpha/beta if documented.

## Compatibility claim rule
Never advertise only “Spine compatible”.
Publish:
- tested version family;
- exact 3.8.75 status;
- supported features;
- baked/unsupported features;
- corpus/release version.
