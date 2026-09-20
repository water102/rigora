# STEP-07 — Mesh and Weights Productization

## Scope

`WGT-01..13`, `D43-04`, `D43-05`; integrates attachment topology from STEP-05.

## Outcome

Đưa toàn bộ topology/selection/auto-mesh/auto-weight/brush/deform algorithms từ
lab vào product editor, với shared commands, workers, undo và performance gates.

## Preconditions

- STEP-05 mesh/path/bbox/clipping product editors available.
- STEP-06 skin/linked attachment mapping stable.

## Subplans

### P01 — Product Mesh Tools and selection

- Dockable/contextual Mesh Tools; setup/UV/deformed modes.
- Vertex/edge/face picking, box/lasso, soft selection/hull-only, multi-attachment.

### P02 — Bind/unbind and numeric weights

- Bone list/common bones, bind/update/unbind/remap confirmation.
- Per-vertex/per-bone table, mixed values, normalize/locks/influence limits.

### P03 — Visualization and direct edit

- Pies/overlay/heatmap/legend/selected-only.
- Direct drag/edit with visible normalization and locked influence behavior.

### P04 — Brush engine

- Add/remove/replace/erase, radius/strength/feather/falloff/cursor preview.
- Sparse delta, one stroke/undo, cancel restore, deterministic sampling.

### P05 — Auto/smooth/prune/weld

- Worker preview/apply/cancel/error; scope and seed policy.
- Smooth iterations/strength, prune thresholds/max bones, weld tolerance.

### P06 — Copy/paste and bone remap

- Topology compatibility, duplicate-bone mapping, ambiguity report.
- Multi-mesh common/mixed state and atomic operation.

### P07 — Deform authoring integration

- Setup vs animation deform, zero/reset, weighted/unweighted.
- Dopesheet/Graph hooks without implementing their UI prematurely.

### P08 — Performance and robustness

- Large mesh/multi-mesh benchmarks; worker cancellation; memory bounds.
- Degenerate/invalid topology, NaN, locked normalization and undo regression.

## Integration slice

Region→mesh → trace/edit → bind → auto-weight → brush/smooth/prune/weld → pose
test → deform → copy/paste multi-mesh → save/reopen.

## Gate

- VS-02 Mesh production pass through product editor.
- No lab-only control is required for accepted workflow.
- Brush stroke/worker apply are atomic and within budget.
- Numeric/vertex visual oracle and malformed-mesh regression pass.
