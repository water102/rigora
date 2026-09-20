# STEP-10 — Graph Editor and Curve Semantics

## Scope

`GRAPH-01..10`, `D43-12`; shared selection/channel contracts with STEP-09.

## Outcome

Graph editor hỗ trợ all channels, exact stepped/linear/Bezier behavior, tangent/
preset/value/shape/favor workflows, bidirectional Dopesheet sync và runtime oracle.

## Preconditions

- STEP-09 channel registry, timebase, key selection and clipboard verified.

## Subplans

### P01 — Graph viewport and rows

- Shared hierarchical rows/filter/lock/current-tool scope.
- Pan/zoom/frame selected/all/auto zoom; repeated loop curves; legends.

### P02 — Curve evaluator parity

- Stepped/linear/cubic Bezier, rotation wrapping and fractional time.
- One evaluator/serialized contract across editor/runtime/export.

### P03 — Key and handle interaction

- Select/box/drag/duplicate/delete/time-value numeric/snap/axis restriction.
- Handle hit-testing, keyboard/focus, stable framing and transaction boundary.

### P04 — Tangent modes and presets

- Automatic/separate/flat/bounce/ease/free equivalents.
- User presets, deterministic serialization and last-chosen default.

### P05 — Value, Shape and Favor

- Functionally equivalent value/shape editing.
- Favor breakdown preserving endpoints/intent.

### P06 — Curve shape preservation

- Revalue/move keys adjusts handles to retain shape.
- Flat/end/zero-duration/overshoot/extreme-value regressions.

### P07 — Sync and multi-curve editing

- Bidirectional Dopesheet sync; box scale/reverse around chosen pivot.
- Multi-property colors/mixed handles and conflict behavior.

## Integration slice

Select Dopesheet channels → reveal Graph → convert interpolation → edit handles/
presets/value/shape/favor → revalue with shape preservation → playback/runtime diff.

## Gate

- Numeric sampled curves match runtime within declared tolerance.
- Rotation wrap, repeated loop and pathological curve fixtures pass.
- UI E2E covers mouse+keyboard+numeric workflows.
- F4 curve/time/channel contracts signed.
