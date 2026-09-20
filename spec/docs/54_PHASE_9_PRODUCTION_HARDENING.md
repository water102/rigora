# 54 — Phase 9: Production Hardening and Release Candidate

## Goal
Convert the complete feature set into a reliable distributable product.

## Execution record

This phase is executed in independently verified batches. Every batch must pass
`pnpm check` and be committed before the next batch starts.

### Batch 1 — Native persistence hardening — complete

- Added bounded archive parsing (archive, file-count, per-asset and total-asset
  limits).
- Rejected absolute, parent-relative and backslash archive paths.
- Added validate-before-publish temporary save flow.
- Added failure-path tests proving an existing project remains readable when a
  temporary write fails.
- Verification: `pnpm check` — 19 test files, 225 tests passed.
- Commit: `c6f37fa feat: harden native project persistence`.

### Batch 2 — Qualification evidence — complete

- The repository qualification command is `pnpm check` and runs typecheck,
  formatting/boundary checks, unit tests and production builds.
- Security-focused native archive cases are part of
  `tests/unit/editor-foundation.test.ts`.
- Production build warnings are recorded as non-fatal: third-party React
  `use client` directives and bundle-size advisories.
- Compatibility corpus, native migration, crash-kill, visual, install and
  platform-package evidence remain release-blocking until real fixtures and
  packaged artifacts are available.

### Batch 3 — Dependency release metadata — complete

- Added reproducible `pnpm release:metadata` generation from the installed
  dependency graph.
- Published CycloneDX 1.5 inventory at `docs/release/SBOM.json`.
- Published dependency/license summary at
  `docs/release/THIRD_PARTY_NOTICES.md`.
- The generated notices are a release input; final distribution must include
  the full license texts and a separate review of application assets/fonts.

### Batch 4 — Performance evidence — complete

- Published `docs/release/PERFORMANCE_REPORT.md` from the existing selection
  and skinning benchmarks.
- Skinning passes the stated runtime smoke budget at 0.223 ms/frame.
- Selection is 8.833 ms/sample against the <8 ms typical target and remains an
  optimization candidate; this does not block correctness qualification.

### Batch 5 — Native migration path — complete

- Added explicit `migrateProject()` handling for pre-release manifest version 0.
- Current version 1 projects are verified before being returned.
- Unknown versions fail with `NATIVE_MIGRATION_REQUIRED` and are never
  rewritten implicitly.
- Migration output is validated before use and the input bytes are untouched.
- Added migration and major-version rejection tests.

### Batch 6 — Windows package preflight — environment-blocked

- Added `pnpm release:preflight` to validate release manifests and detect a
  missing Rust toolchain before invoking Tauri.
- Attempted `pnpm tauri:build` on 2026-09-20.
- Result: blocked because `cargo` is not available on PATH. Frontend builds
  remain covered by `pnpm check`; MSI/NSIS qualification cannot be claimed
  until Cargo/Rust is installed in the build environment.

### Batch 7 — Browser/E2E qualification — complete

- Ran `pnpm test:browser` successfully: 3/3 Playwright tests passed.
- Covered WebGL preview pixels, weighted mesh/auto-mesh worker rendering and
  guarded export planner output.
- Published `docs/release/E2E_QUALIFICATION.md`.

### Batch 8 — Release documentation — complete

- Published `docs/release/USER_GUIDE.md` covering quick start, workflow,
  import/export caveats and recovery behavior.
- Published `docs/release/DEVELOPER_GUIDE.md` covering package boundaries,
  adapter rules, native migration and release commands.

### Batch 9 — Internal corpus qualification — complete

- Added `pnpm release:corpus` to build adapters and qualify the checked-in
  Spine 3.8 and DragonBones fixtures, including an expected DragonBones 6.0
  rejection.
- Published `docs/release/CORPUS_QUALIFICATION.json`.
- External mandatory corpora remain separate release blockers; checked-in
  fixtures are not claimed as vendor corpus coverage.

### Batch 10 — Native manifest security hardening — complete

- Native parsing now validates manifest field types, required arrays and
  duplicate IDs before traversing project content.
- Added malformed-manifest coverage to the security tests.

### Batch 11 — Package artifact verification — complete

- Added `pnpm release:verify-artifacts` to require non-empty MSI and NSIS
  bundle outputs under `src-tauri/target/release/bundle`.
- The verifier intentionally fails when Cargo/build artifacts are absent; it
  cannot substitute for clean-machine install, upgrade and uninstall tests.

### Batch 12 — Decompression expansion limits — complete

- Added a total expanded-byte limit to native archive parsing, covering
  skeletons, editor state, provenance and assets.
- Added regression coverage for an oversized expanded archive.

### Batch 13 — Windows package build — complete

- Installed Rustup/stable MSVC toolchain with explicit user approval.
- Added an internal Rigora icon and declared it explicitly in Tauri config.
- `pnpm tauri:build` produced both NSIS and MSI bundles.
- `pnpm release:verify-artifacts` passed for both non-empty artifacts.
- Hashes and sizes are recorded in `docs/release/PACKAGE_QUALIFICATION.md`.

### Batch 14 — Installer qualification — partial

- NSIS install/uninstall passed locally with clean removal.
- MSI install returned `1603` and rolled back without residue; the failure is
  recorded in `docs/release/INSTALL_QUALIFICATION.md`.
- MSI clean-install qualification remains an explicit blocker.

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
- [x] zero known critical data-loss defect in covered native save/recovery paths
- [ ] zero known critical compatibility regression
- [ ] mandatory Spine 3.8.75 corpus green (fixture/package evidence required)
- [ ] supported 4.2 corpus green (fixture/package evidence required)
- [ ] DragonBones corpus green (fixture/package evidence required)
- [x] native migration green (version 0 → 1 path covered)
- [x] crash recovery baseline green (autosave corruption is handled safely)
- [x] performance report published (selection follow-up remains)
- [ ] package fully qualified (NSIS passes; MSI install returns 1603)
- [x] browser E2E smoke suite green (native package tests remain separate)
- [x] SBOM/notices generated (legal review and bundled license texts remain)
- [x] user/developer docs complete

The remaining unchecked items are deliberate release blockers, not claims of
completion. Phase 9 is not release-qualified until each has attached evidence.
