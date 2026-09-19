# 49 — Phase 4: Editor Foundation

## Goal
Provide a reliable local-first authoring shell and native project lifecycle.

## Entry
P1 complete; command/persistence architecture accepted. P2/P3 may continue in parallel behind stable interfaces.

## A — Web shell
- React
- Vite
- error boundary
- application services container.

## B — Desktop shell
Tauri 2:
- native dialogs
- filesystem
- clipboard
- recent files
- application metadata.

No Tauri type leaks into domain packages.

## C — Docking layout
Panels:
- Hierarchy
- Stage
- Inspector
- Timeline placeholder
- Diagnostics
- History.

Persist layout as editor preference, not authored skeleton state.

## D — Native project
Implement `.hbone`:
- manifest
- skeleton JSON
- assets
- editor state
- provenance
- checksums.

## E — Project repository
Implement:
- Tauri filesystem
- browser IndexedDB
- in-memory test repository.

## F — Lifecycle
- New
- Open
- Save
- Save As
- Close
- dirty prompt
- recent files
- import external file into a new project.

## G — Command/history
- execute
- undo
- redo
- grouping
- transaction
- merge
- dirty-state integration
- history labels.

## H — Selection
Support selected:
- bone
- slot
- attachment
- constraint
- animation.

Mesh sub-selection arrives P6.

## I — Stage
- Pixi renderer
- camera abstraction
- pan/zoom
- frame all
- frame selection
- grid
- debug bones
- selection highlight.

## J — Hierarchy
Commands:
- create
- delete
- rename
- reparent
- preserve-world reparent.

## K — Inspector
Schema-driven editable sections for available entity types.
Validation precedes command commit.

## L — Autosave/recovery
- periodic recovery package;
- bounded snapshots;
- abnormal shutdown detection;
- restore prompt;
- never overwrite imported source file.

## Exit gate
- [ ] web app starts
- [ ] desktop app starts
- [ ] native new/open/save/save-as works
- [ ] native round-trip lossless
- [ ] hierarchy edits undo/redo
- [ ] stage select/pan/zoom works
- [ ] inspector edits canonical model
- [ ] autosave/recovery baseline works
- [ ] no Pixi/Tauri objects persisted
- [ ] React store is not canonical source of truth

## Freeze F4
Command and persistence interfaces become change-controlled.
