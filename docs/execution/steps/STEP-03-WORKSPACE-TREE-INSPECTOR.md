# STEP-03 — Workspace, Tree, Inspector and Problems

## Scope

`UI-01..15`, `TREE-01..10`, `D43-03`, `D43-16`, `D43-22`, `D43-23`, `D43-27`.

## Outcome

Biến Editor Shell thành workspace sản xuất có project lifecycle, docking, Setup/
Animate, virtual Tree, schema-driven Inspector, Problems, Package Project và
Spine-compatible migration profile.

## Preconditions

- STEP-02 F1 frozen.
- Command/selection/diagnostics/task contracts available.

## Primary areas

`apps/editor-shell`, `@rigora/editor-core`, `@rigora/project`,
`@rigora/diagnostics`; không chuyển domain semantics vào React components.

## Subplans

### P01 — Shell and project browser

- Main menu/title/dirty state/New/Open/Save/Save As/Recent/recovery.
- Custom picker: recent/favorite/filter/path/error; external-change prompts.

### P02 — Docking and modes

- Dock/undock/resize/minimize/close/reopen/focus/persist/multi-monitor policy.
- Setup/Animate mode registry; invalid action disabled có explanation.

### P03 — Virtual Tree core

- Full hierarchy, expand/collapse, multi/range, selection history, reveal.
- Visibility/lock/key state/annotations/property area, large-project virtualization.

### P04 — Tree operations and search

- Validated drag/drop/reorder/reparent, insertion preview, auto-scroll, atomic undo.
- Filters, wildcard/regex, find/replace preview, hover asset preview.
- Folder CRUD/color/pin/recursive duplicate/path semantics.

### P05 — Inspector framework

- Schema fields, mixed value, expressions, validation, reset/copy/paste, key state.
- Batch edit and command transaction; accessibility/keyboard/focus.

### P06 — Problems and safe fixes

- Aggregate diagnostics, select/reveal entity/skin, live refresh.
- Fix preview, idempotence, undo, result report; không auto-fix destructive.

### P07 — Safety and packaging

- Atomic save/copy, lock/retry, external change, OOM warning, recovery compare.
- Package Project ZIP manifest, required assets, missing report, export-disabled policy.

### P08 — Spine-compatible UI profile

- Optional layout/default hotkey/terminology/icon-semantic profile.
- One-click switch/reset; all deviation measured by workflow benchmark.

## Integration slice

Open/recover project → switch mode/layout → find/reparent/rename entity → mixed
Inspector edit → Problems fix → undo/redo → save/reopen → Package Project.

## Gate

- UI state sync và persistence survive restart.
- Tree benchmark đạt budget với project lớn.
- Every persistent action command-backed; Problems fixes undoable.
- E2E keyboard/mouse workflow và accessibility smoke pass.

## Handoff evidence

- UI recordings, Tree benchmark, save/recovery/package fixtures, requirement-layer updates.
