# 54 — Phase 9: Production Hardening and Release Candidate

## Goal
Convert the complete feature set into a reliable distributable product.

## Entry
P0–P8 functional gates green. Feature freeze except critical fixes.

## A — Profiling/performance
Measure:
- runtime transform;
- constraints;
- mesh skinning;
- GPU upload;
- stage interaction;
- timeline;
- mesh/weight tools;
- import/export;
- load/save.

Optimize only measured hotspots.

Potential actions:
- SoA/typed arrays;
- cache improvements;
- workerization;
- timeline Canvas/Pixi replacement;
- WASM only with measured benefit.

## B — Memory/leaks
Stress:
- repeated project open/close;
- huge textures;
- many skeleton instances;
- undo history;
- repeated import;
- worker jobs.

Validate destruction:
- Pixi textures;
- event listeners;
- workers;
- blob/object URLs.

## C — Save/recovery
Scenarios:
- process kill during save;
- corrupted temporary file;
- corrupted project;
- disk-full/write failure;
- recovery snapshot restore.

Use temp + validation + atomic replace.

## D — Native migrations
Test:
- previous minor -> current;
- previous major -> explicit migration path;
- failed migration leaves original intact.

## E — Security
Review/test:
- ZIP traversal;
- decompression bomb;
- image dimension limits;
- malformed JSON;
- Tauri permissions;
- external URLs;
- plugin boundary if present.

## F — Packaging
Primary Windows.
Then macOS/Linux per product priority.

Test:
- clean install;
- upgrade;
- uninstall;
- app data;
- file association if implemented.

## G — UX/accessibility
- keyboard navigation;
- focus;
- high DPI;
- shortcut help;
- scalable panels;
- non-color-only error states;
- consistent dialogs.

## H — Documentation
User:
- quick start;
- import;
- rig;
- animate;
- mesh/weights;
- constraints;
- export;
- compatibility caveats.

Developer:
- architecture;
- adapters;
- runtime SDK;
- native format;
- command API.

## I — Legal/release metadata
- SBOM
- third-party notices
- dependency licenses
- fonts/icons/assets licenses
- clean-room record
- precise compatibility wording.

## J — Qualification
Run:
- complete unit suite
- all fixtures
- visual suite
- round-trip
- E2E
- migration
- recovery
- performance
- security
- package install tests.

## Exit gate
- [ ] zero known critical data-loss defect
- [ ] zero known critical compatibility regression
- [ ] mandatory Spine 3.8.75 corpus green
- [ ] supported 4.2 corpus green
- [ ] DragonBones corpus green
- [ ] native migration green
- [ ] crash recovery green
- [ ] performance report published
- [ ] package qualified
- [ ] SBOM/notices complete
- [ ] user/developer docs complete
