# STEP-08 — Constraints and Physics Authoring

## Scope

`CON-01..12`, `D43-01`, `D43-02`, `D43-10`, shared `D43-13`.

## Outcome

IK, transform, path, physics và slider constraints được create/edit/order/skin/
key/preview/export-preflight hoàn toàn bằng UI, dùng cùng runtime semantics.

## Preconditions

- Rigging, attachment/path, skins và mesh/weights contracts verified.
- Constraint evaluation order is single-owner.

## Subplans

### P01 — Common constraint framework

- CRUD/folders/runtime paths/order/reset-auto-order/dependency visualization.
- Common mix, copy/paste settings, skin membership, warnings and diagnostics.

### P02 — IK

- One/two bone creation wizard, target/chain validation, bend, mix.
- Compress/stretch/uniform/softness/volume-preserving scaleY.
- Negative scale/reflection/nonuniform/zero-scale fixtures.

### P03 — Transform constraint 4.3

- Map source property to one/many destination property types.
- Local/world source+destination, clamp, offset/Match, per-property mixes.
- Inspector and viewport handles with exact numeric oracle.

### P04 — Path constraint

- Target slot/path, constrained list and order.
- Spacing/position modes; tangent/chain/chain-scale; offsets and mixes.
- Constant-speed/nonconstant path and deform interaction.

### P05 — Physics

- Axes/limit/FPS, inertia/strength/damping/mass/wind/gravity/global/mix.
- Deterministic fixed step, reference scale, reset/reset-all/warm-up/seek.
- Low update/render rates and volume-preserving scaleY.

### P06 — Slider constraint

- Source bone/local/property map/frame range/loop/additive/frame/mix.
- Reusable animation drive, serialization, skin and runtime tests.

### P07 — Keying/export hooks

- Per-field key state and command API for STEP-09.
- Key Constrained/manual physics bake contract; bake remains extension.
- Capability report for target formats.

## Integration slice

IK → transform → path → physics → slider → order/dependency → skin membership →
key hooks → preview/reset → save/reopen/export preflight.

## Gate

- VS-04 Advanced rig pass.
- Editor/runtime numeric oracle within declared tolerance.
- Deterministic reset/warm-up/seek and reference-scale tests pass.
- F3 evaluation order/constraint interfaces signed.
