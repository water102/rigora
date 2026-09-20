# STEP-04 — Rigging and Viewport Tools

## Scope

`RIG-01..11`, `TOOL-01..14`, `D43-07`, `D43-13`, `D43-14`, `D43-22`, `D43-23`.

## Outcome

Người dùng tạo và chỉnh skeleton/bones/slots/folders/draw order bằng viewport,
Tree và Inspector; mọi transform chính xác, undoable, keyable và save/reopen được.

## Preconditions

- STEP-03 workspace/Tree/Inspector/commands stable.
- Transform/inheritance contracts và runtime pose evaluator verified.

## Subplans

### P01 — Skeleton, bone and slot CRUD

- Multi-skeleton create/select/order/visibility/solo/dim/unload/export toggle.
- Bone create/delete/duplicate/reparent, immutable creation order metadata.
- Slot CRUD, attachment parent, folders và runtime path preview.

### P02 — Transform tools

- Rotate/Translate/Scale/Shear/Bone Length/Create/Pose tools.
- Local/Parent/World axes; pivot/snap/numeric/multi-edit/cancel.
- Correct negative scale, reflection, shear và inherit modes.

### P03 — Compensation and reparent

- Preserve-world reparent; image/bone compensation; move selected slot/image policy.
- Preview affected descendants và atomic undo.

### P04 — Selection and overlays

- Smart/toggle/multi/box selection, candidate cycle, selection history/groups.
- Per-type selectable/visible/name/icon/color/tag controls.
- Grid/ruler/guides/pixel snap/overlay/isolate.

### P05 — Slots and draw order

- Light/dark tint, alpha, blend modes, visibility semantics.
- Slot reorder, draw-order keys và ghost preview.
- Draw-order folder CRUD/reset/independent timelines/multi-track contract.

### P06 — Advanced editor operations

- Split/Fibonacci split, Separate X/Y, copy/paste transform/vertices.
- Key Constrained capture contract.
- Safe numeric expression engine: variables/functions/assignment prefixes/locale.

## Task constraints

- Không làm transform math riêng trong UI.
- Một drag/paste/split/expression batch là một command transaction.
- Expression parser không dùng `eval`/dynamic code execution.

## Integration slice

Project trống → image root → skeleton/bones/slots/folders → transforms/inheritance
→ colors/draw order → reparent preserve-world → save/reopen → undo/redo.

## Gate

- VS-01 Character setup pass bằng UI, không sửa JSON.
- Numeric/gizmo result khớp runtime evaluator.
- Cross-skeleton drag, zero-scale và reflection regression pass.
- TOOL/RIG requirements có browser evidence và performance sample.
