# STEP-14 — CLI, Settings, Versioning and Project Packaging

## Scope

`CLI-01..06`, `SET-01..06`, supporting `UI-10`, `UI-13`, `UI-14`, `UI-15`,
`D43-16`, `D43-25`, `D43-27`.

## Outcome

Mọi pipeline quan trọng chạy headless bằng stable CLI và settings/preset dùng
chung với UI; application settings/migration/backups/recovery/package project và
runtime validator executable đạt production quality.

## Preconditions

- STEP-13 preset/export APIs frozen.
- Project migration/recovery contracts từ STEP-02/03 available.

## Subplans

### P01 — CLI command surface

- Import/export/cleanup/pack/unpack/info/multiple commands.
- Stable help/version, input/output overrides, folder input and output creation.
- Non-zero exit, machine-readable report, verbose/trace/resource limits.

### P02 — Target 4.3 CLI extensions

- Last settings, all/named animation import, export-all.
- Structured `--set` for arrays/objects; project checks/repair.
- Version-locked `--help` snapshot and unknown-option policy.

### P03 — CLI execution quality

- No stdin/GUI dependency; deterministic locale/timezone/path handling.
- Parallel jobs, cancellation/signal, memory limits and OS integration tests.

### P04 — Settings architecture

- Versioned schema, defaults, validation, migration, reset and live preview.
- Files/backups/hotkeys/log; general/color/FPS/instance/welcome.
- UI/language/font/scale/rows; viewport; behavior; Dopesheet/Graph.

### P05 — Hotkeys and Spine-compatible profile

- Search/remap/import/export/reset/conflict/context modes.
- Optional Spine-compatible default profile; workflow tests and one-click revert.

### P06 — Versioning, backups and recovery

- Version display/migration preview/forward block/retention/compare/restore.
- Lock/retry/external-change/OOM/atomic save and crash recovery.

### P07 — Package Project

- Portable ZIP, manifest, images/audio/PSD/settings selection.
- Missing/dependency/export-disabled report and path traversal guards.

### P08 — Runtime validator executable

- CLI launch or standalone viewer using same core; file watch/reload and reports.

## Integration slice

Clean checkout CI: import → repair/check → edit fixture → export → pack → info →
validator; migrate settings/project → backup/recovery → Package Project.

## Gate

- UI and CLI effective configuration/output match.
- Cross-platform headless suite and exit-code/help snapshots pass.
- Settings/project migration, recovery and package security pass.
- F5 I/O/CLI/preset/version compatibility claims signed.
