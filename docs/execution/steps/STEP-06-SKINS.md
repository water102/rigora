# STEP-06 — Skins and Mix-and-Match Workflows

## Scope

`SKIN-01..08`, `D43-15`, `D43-18`, shared `D43-20` preview responsibility.

## Outcome

Skins view hỗ trợ full CRUD, placeholders, pinned multi-skin preview, skin bones/
constraints, merge/copy/mix-and-match và large-skin workflows; animation không
bị nhân bản theo skin.

## Preconditions

- STEP-05 attachment/linked-mesh and Tree folder contracts stable.

## Subplans

### P01 — Skin model and CRUD UI

- Create/duplicate/rename/delete/reorder/folder/color/export.
- Stable active skin, runtime/default policy và deterministic override order.

### P02 — Placeholders and assignment

- Placeholder CRUD, Tree grouping, runtime path/name preview.
- Move/duplicate attachment strategy, linked mesh/inherit deform, optional key copy.

### P03 — Pinned multi-skin preview

- Pin/unpin/reorder; visible override resolution and conflict explanation.
- Only-pinned filters, pinned attachments under placeholders.

### P04 — Skin bones and constraints

- Add/remove dependency, warning/fix when hidden dependency required.
- Viewport visibility/selectability and export capability.

### P05 — Merge/copy/mix-and-match

- Drag/drop skin/placeholder/folder, mapping preview, conflict policy.
- Auto-add dependency bones/constraints; fixups in one undo transaction.

### P06 — Large-skin and atlas preview

- Virtualized list, folder colors/pinning/search/filter.
- Per-skin atlas preview contract; actual packing deferred to STEP-13.

## Integration slice

Create placeholders → two skins → linked meshes → skin bones/constraints → pin
compare → merge/copy → one shared animation → save/reopen/export preflight.

## Gate

- VS-03 Skin production pass.
- Missing dependency/override conflicts are actionable, not silent.
- Merge/copy is atomic undo and deterministic.
- Large-skin benchmark meets budget.
