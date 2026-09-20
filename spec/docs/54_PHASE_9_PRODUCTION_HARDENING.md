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

### Batch 15 — Elevated MSI qualification — complete

- Re-ran MSI through UAC elevation after diagnosing Windows Installer Error
  1925 from the non-elevated attempt.
- MSI install/uninstall passed with clean removal.
- Both configured Windows installer families are now qualified locally.

### Batch 16 — Master checklist reconciliation — complete

- Updated `58_PROJECT_CHECKLIST.md` to reflect only evidence-backed native,
  test, release metadata and documentation work.
- External vendor corpus, property-based/fuzz coverage and asset-license review
  remain intentionally unchecked.

### Batch 17 — Asset license record — complete

- Added `docs/release/ASSET_LICENSES.md` for the in-house application icon,
  fonts, dependency-provided UI icons and research-material boundary.
- Product asset provenance is now explicit; research material remains excluded
  from release assets.

### Batch 18 — Native security qualification — complete

- Added `pnpm release:security` with five hostile/malformed native archive
  cases and expected diagnostic assertions.
- Published `docs/release/NATIVE_SECURITY_QUALIFICATION.json`.
- This is deterministic security regression coverage, not a substitute for
  long-running fuzzing or third-party archive corpus testing.

### Batch 19 — Parser mutation qualification — complete

- Added `pnpm release:parser-mutations` with 20 deterministic malformed Spine
  and DragonBones mutations.
- Every mutation is required to reject transactionally without an importer
  throw.
- The generated evidence is published at
  `docs/release/PARSER_MUTATION_QUALIFICATION.json`.

### Batch 20 — Qualification orchestrator — complete

- Added `pnpm release:qualification` to run all internal release gates in a
  deterministic fail-fast sequence.
- External vendor corpus and clean-machine qualification remain intentionally
  outside this local orchestrator.

### Batch 21 — Local example corpus probe — partial

- Added `pnpm release:example-corpus` to scan the ignored `example/` directory
  and exercise the Spine 3.8, Spine 4.2 and DragonBones adapters against the
  downloaded public runtime/demo repositories.
- The probe discovered 116 Spine 3.8 JSON files, 136 Spine 4.2 JSON files and
  172 DragonBones JSON files without importer throws.
- This is diagnostic evidence only: the current adapters accept 5/116 Spine
  3.8 files, 7/136 Spine 4.2 files and 0/172 DragonBones files when atlas
  metadata is not supplied, so the official corpus gates remain open. The
  detailed per-file result is recorded in
  `docs/release/EXAMPLE_CORPUS_QUALIFICATION.json`.
- The downloaded assets remain local-only under ignored `example/` and are not
  part of the repository or release artifacts.

### Batch 22 — Example atlas metadata probe — complete

- The example corpus runner now reads adjacent DragonBones `*_tex.json` atlas
  files and supplies their real subtexture dimensions to the adapter.
- This separates missing-atlas-data failures from parser failures. The latest
  probe run improved DragonBones from 0/172 to 1/172 successful imports; the
  remaining failures are now dominated by source-schema and unsupported
  feature diagnostics rather than absent atlas dimensions.

### Batch 23 — Spine atlas metadata probe — complete

- The corpus runner now parses adjacent Spine `.atlas` text exports and loads
  real region dimensions into the qualification options.
- The Spine 3.8 probe no longer reports unresolved texture warnings for the
  downloaded export set; remaining failures represent schema, mesh, behavior,
  preservation, or version coverage rather than missing atlas lookup data.

### Batch 24 — DragonBones nested-armature preservation — partial

- Preserved nested DragonBones armature display records as explicit
  `unknownPreserved` attachments with diagnostic
  `DB55_NESTED_ARMATURE_PRESERVED`; the importer does not fabricate skeleton
  links before canonical linking support exists.
- Added a regression fixture test and reran the local ignored corpus probe:
  424 files were recognized and no importer threw. DragonBones success rose to
  34/172, with 20 nested-armature preservation diagnostics.
- This improves loss-minimizing inspection behavior but does not make the
  DragonBones corpus gate green; unsupported source fields and schema cases
  remain release blockers.

### Batch 25 — DragonBones mesh edge metadata acceptance — partial

- DragonBones mesh displays may contain exporter topology hints in `edges` and
  `userEdges`; these fields are now accepted during import instead of being
  rejected as unsupported source fields. Canonical triangle topology remains
  authoritative until an explicit edge contract is added.
- Added a regression test covering both fields. The local corpus remains at
  34/172 successful DragonBones imports, confirming this batch is a compatibility
  expansion rather than a claim that the vendor corpus is release-green.

### Batch 26 — DragonBones color-offset tolerance — partial

- DragonBones slot color offsets (`aO`, `rO`, `gO`, `bO`) no longer abort an
  otherwise importable skeleton. Nonzero offsets now emit
  `DB55_COLOR_OFFSET_PRESERVED` while the canonical color multipliers remain
  usable.
- The local corpus probe improved DragonBones from 34/172 to 39/172 successful
  imports. The warning is intentionally retained because canonical color
  evaluation does not yet apply offset channels.

### Batch 27 — DragonBones 5.6 schema admission — partial

- The DragonBones adapter now admits versioned 5.6 exports when they use the
  5.5-compatible JSON schema, while continuing to reject unsupported 5.0 and
  other families explicitly.
- Added a version regression test. The downloaded 5.6 examples still contain
  separate schema/feature failures, so the corpus total remains 39/172 and the
  DragonBones release gate remains open.

### Batch 28 — DragonBones 5.0 schema admission — partial

- The adapter now admits DragonBones 5.0 skeletal exports when their structure
  is compatible with the normalized adapter path; unsupported families remain
  rejected explicitly.
- The corpus probe now reports eight fewer `DB55_UNSUPPORTED_VERSION`
  diagnostics. Existing 5.0 files still have independent schema/feature
  failures, so successful imports remain 39/172 and the release gate stays open.

### Batch 29 — Spine 4.2 sequence metadata acceptance — partial

- Spine attachments with 4.2 `sequence` metadata are now accepted by the
  isolated 4.2 adapter path; the metadata is tolerated while canonical frame
  sequence evaluation remains outside the current runtime contract.
- Added a 4.2 regression test. After rebuilding the adapter, the local corpus
  improved from 8/136 to 13/136 successful imports and reduced
  `CORE_UNSUPPORTED_SOURCE_FIELD` diagnostics from 104 to 99.

### Batch 30 — Spine 4.2 bone metadata mapping — partial

- Spine 4.2 bone `inherit` is now mapped to the canonical inheritance field;
  editor-only `icon` metadata is accepted without affecting runtime pose
  evaluation.
- Added a regression test. The corpus still has 13/136 successful 4.2 imports,
  but unsupported-source-field diagnostics dropped from 99 to 22, exposing the
  remaining mesh/schema/texture issues for subsequent batches.

### Batch 31 — Spine 4.2 skin dependencies — partial

- Spine 4.2 skin-level `bones` metadata now maps to canonical
  `requiredBoneIds`; attachment `skin` metadata is accepted and `linkedmesh`
  attachments use the existing linked-mesh normalization path.
- Added a regression test. The corpus remains at 13/136 successful 4.2
  imports, while unsupported-source-field diagnostics are now down to 11;
  remaining failures are primarily mesh validation, schema, and texture data.

### Batch 32 — Spine 4.2 skin transform metadata — partial

- Spine skin-level `transform` bone lists now join `bones` and map to
  canonical `requiredBoneIds`; skin-level `path` metadata is accepted as an
  export hint.
- The 4.2 corpus now has only one `CORE_UNSUPPORTED_SOURCE_FIELD` diagnostic
  (down from 11). The remaining failures are explicit reference, mesh,
  schema, behavior, and texture qualification issues.

### Batch 33 — Empty Spine animation preservation — partial

- Empty Spine animation maps such as `{ "animation": {} }` are now preserved
  as valid animations with no timelines and warning
  `SP38_EMPTY_ANIMATION_PRESERVED`, instead of rejecting the whole skeleton.
- Added a regression test. The 4.2 corpus improved from 13/136 to 14/136
  successful imports; the remaining failures are no longer unsupported-field
  rejection for this case.

### Batch 34 — Array-valued Spine animation channels — partial

- Spine animation channels represented as arrays, including `drawOrder` and
  `events`, are now preserved as `spine.raw.*` timelines with warning
  `SP38_ANIMATION_CHANNEL_PRESERVED` instead of failing object validation.
- Added a regression test. The local corpus improved from 14/136 to 27/136
  successful Spine 4.2 imports; the same compatibility path preserves array
  channels in the Spine 3.8 probe as well.

### Batch 35 — Spine point attachment preservation — partial

- Spine `point` attachments are now preserved as `unknownPreserved` payloads
  with warning `SP38_POINT_ATTACHMENT_PRESERVED`; no synthetic region or mesh
  geometry is generated.
- Added a regression test. The downloaded 4.2 set now reports the point case
  explicitly; overall success remains 27/136 because that file has additional
  mesh/reference failures.

### Batch 36 — Spine packed weighted mesh decoding — partial

- Added decoding for Spine packed weighted mesh vertices (`boneCount` followed
  by bone index, local position, and weight tuples) and mapped them to
  canonical `weightedVertices`.
- Added a regression test. The local Spine 4.2 corpus improved from 27/136 to
  33/136 successful imports. Remaining weighted assets expose explicit weight
  sum/reference validation issues for the next qualification batch.

### Batch 37 — Spine packed weight normalization — partial

- Packed weighted mesh influence weights are normalized to a unit sum before
  canonical validation, correcting exporter rounding such as `0.99999` and
  `1.00001` without changing relative influence ratios.
- Corpus qualification improved Spine 3.8 from 5/116 to 32/116 and Spine 4.2
  from 33/136 to 111/136 successful imports. Remaining failures are explicit
  reference/schema/texture/behavior cases.

### Batch 38 — Skin-specific Spine setup attachments — partial

- Slots whose setup attachment exists only in a non-default skin are now
  imported with no fabricated setup reference and warning
  `SP38_SETUP_ATTACHMENT_UNRESOLVED`.
- Added a regression test. Spine 4.2 corpus success improved from 111/136 to
  126/136; remaining failures are concentrated in texture/schema/reference
  validation and preserved behavior warnings.

### Batch 39 — Spine reference and packed-weight tolerance — complete

- Tiny negative packed weights caused by exporter rounding are clamped before
  normalization; unresolved skin-required bone names are omitted with
  `SP38_SKIN_BONE_UNRESOLVED` instead of failing the import.
- The complete downloaded Spine 4.2 corpus is now green at 136/136 successful
  imports with zero failed files. This is corpus evidence for the downloaded
  4.2 runtime exports, not yet the separate official release gate.

### Batch 40 — Nested Spine animation preservation — partial

- Non-keyed or nested animation channels such as deform/draw-order structures
  are now preserved as `spine.raw.*` timelines with
  `SP38_ANIMATION_TIMELINE_PRESERVED`, avoiding invalid targetless canonical
  timelines.
- Added a regression test. Spine 3.8 corpus improved from 32/116 to 94/116;
  Spine 4.2 remains fully green at 136/136. Remaining 3.8 failures are
  concentrated in explicit version, path/constraint, reference, and texture
  qualification cases.

### Batch 41 — Spine 3.8 version coverage classification — partial

- Re-audited the 22 remaining failed files in the downloaded Spine 3.8 branch:
  every one is an explicitly unsupported `3.8.26-beta` or `3.8.33-beta` export,
  not a parser failure in the supported 3.8 path.
- The probe therefore keeps strict version rejection and records 94/116
  successful imports. This corpus still cannot serve as the mandatory exact
  Spine 3.8.75 gate because the downloaded branch does not contain that exact
  official export corpus.

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
- [x] package fully qualified locally (MSI/NSIS install and uninstall pass)
- [x] browser E2E smoke suite green (native package tests remain separate)
- [x] SBOM/notices generated (legal review and bundled license texts remain)
- [x] user/developer docs complete

The remaining unchecked items are deliberate release blockers, not claims of
completion. Phase 9 is not release-qualified until each has attached evidence.
