# STEP-11 — Playback, Preview and Auxiliary Views

## Scope

`VIEW-01..14`, review responsibility for `ASSET-05..06`, `EVT-02/03/05`,
`D43-26`.

## Outcome

Animator review hoàn chỉnh bằng Playback, independent Preview, 15-track mixing,
Ghosting, Audio, Metrics, Outline, Color, Mesh Tools và Runtime Validator; các
view quan sát không mutate document.

## Preconditions

- STEP-09/10 animation and curve semantics verified.
- Runtime track/mixing/additive contracts available.

## Subplans

### P01 — Playback service

- Play/pause/step/scrub/loop/speed/FPS/stepped/interpolated.
- Shared deterministic clock, event dispatch and low-rate simulation policy.

### P02 — Independent Preview

- Skeleton/skin/animation/camera independent of Stage.
- Track add/remove/order/speed/mix/repeat/alpha/hold previous/additive/crossfade.
- Up to 15 tracks or documented equivalent with performance proof.

### P03 — Mixing semantics 4.3

- Additive/non-linear mix, negative/zero mix edge cases, interpolation and setup reset.
- Editor/runtime/validator oracle.

### P04 — Ghosting

- Frame/key before/after/current, steps/fractional/loop/colors.
- Motion vectors/threshold/images-solid/silhouette-xray/anchor/on-top/offset.
- Selection-only, lock/freeze and explicit refresh.

### P05 — Audio view

- Waveform/event tracks/colors/selection/dim/volume/mute/device/missing state.
- Sync with event crossing, seek/loop/reverse and export timing.

### P06 — Metrics and performance

- Entity/timeline/vertex/transform/triangle/area/clipping counts.
- CPU/fill/overdraw proxy/draw calls and selected scope.

### P07 — Outline, Color, Timeline and Mesh Tools views

- Outline click-to-center/pan/zoom/ghost.
- Adaptive HSV/RGBA/two-color/alpha multi-edit.
- Compact Timeline and contextual dockable Mesh Tools.

### P08 — Runtime Validator

- Load/drop/watch JSON/binary+atlas, auto-discovery, PMA/scale/flip/debug.
- Animation/skin/mix controls, setup reset and machine-readable diff.

## Integration slice

Animation → 15-track/additive mix → crossfade → ghost → audio → metrics → outline/
color → export fixture in validator → setup reset.

## Gate

- VS-05 review half pass; document hash unchanged by read-only views.
- Editor preview/runtime validator numeric+visual oracle pass.
- Audio timing and multi-track performance meet budget.
- View state persistence, keyboard and accessibility smoke pass.
