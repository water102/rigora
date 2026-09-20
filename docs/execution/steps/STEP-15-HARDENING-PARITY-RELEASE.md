# STEP-15 — Compatibility Hardening and Parity Release

## Scope

`D43-28` regression families and release verification for all 237 parity requirements.

## Outcome

Biến feature-complete implementation thành parity candidate: no silent loss,
stable large-project performance, accessibility, security, recovery, packaging,
provenance và end-user documentation.

## Preconditions

- STEP-00..14 gates passed; only explicit release blockers remain.

## Subplans

### P01 — Requirement closure audit

- Review 237 parity requirements layer-by-layer; reject false Complete from lab/docs/build only.
- Close orphan evidence, owner, N/A and approved exception records.

### P02 — 4.3 regression families

- Minimal fixtures/tests for undo/redo, invalid meshes, zero scale, skin dependency,
  sequence FPS, clipping, normalization, cross-skeleton drag, export bounds,
  non-ASCII/path security and every observable 4.3.00–4.3.26 fix family.

### P03 — Compatibility corpus

- Native no-loss; Spine 4.3 P0; legacy Spine upgrade; declared DragonBones profiles.
- Object graph, pose, vertices, events, rendered frames and round-trip reports.

### P04 — Vertical slice qualification

- Re-run VS-01..07 on clean checkout with browser/integration recordings.
- No manual JSON/code workaround except explicitly required CLI slice.

### P05 — Performance and memory

- Large skeleton/skin/mesh/timeline/atlas/import/export scenarios.
- Startup, interaction latency, worker cancellation, memory/resource cleanup.
- Publish hardware/profile/method and regression thresholds.

### P06 — Reliability and security

- Autosave/crash/recovery/atomic write/file lock/external change.
- Archive/path traversal, malformed parser, size limits, non-ASCII and temp cleanup.

### P07 — Accessibility and UX migration

- Keyboard/focus/labels/contrast/scaling/reduced motion/error recovery.
- Spine-compatible profile workflow benchmark and deviations report.

### P08 — Packaging and provenance

- Desktop/web artifacts, install/update/uninstall policy, signing where applicable.
- SBOM, third-party notices, asset/icon/font/fixture provenance and license review.

### P09 — Documentation and release claim

- User/developer/migration/CLI/help/troubleshooting docs.
- Exact compatibility table; known deviations; no overclaim.

### P10 — Final review and freeze

- Cross-review Product/Animation UX/Runtime/Formats/QA/Accessibility/Provenance.
- Tag immutable evidence bundle and sign M6 handoff.

## Final gate

- 237/237 parity requirements `Complete` + `Verified`, hoặc approved exception không vi phạm
  “full clone” baseline.
- 28/28 D43 deltas có passing evidence.
- VS-01..07 pass; zero Critical/High unresolved defect.
- No silent data loss; all performance/security/recovery/package gates pass.
- Release notes and compatibility claims match evidence exactly.

## Release evidence

- Parity dashboard, corpus report, vertical-slice recordings, performance/security/
  accessibility reports, SBOM/notices, signed step handoffs and final release report.
