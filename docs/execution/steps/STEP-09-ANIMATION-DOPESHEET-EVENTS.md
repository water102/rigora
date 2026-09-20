# STEP-09 — Animation, Dopesheet, Events and Audio Keys

## Scope

`ANIM-01..13`, `DOPE-01..08`, `EVT-01..05`, `D43-07`, `D43-11`, `D43-13`.

## Outcome

Full-channel animation authoring qua Animation list, Dopesheet và Timeline:
transform/slot/draw-order/event/audio/sequence/deform/constraint/slider keys,
multi-edit, cleanup và sync contract với Graph.

## Preconditions

- STEP-07 deform and STEP-08 constraint key APIs verified.
- Time/frame/key/channel contracts stable.

## Subplans

### P01 — Animation library and timebase

- CRUD/folder/reorder/duplicate/per-skeleton active animation.
- FPS, fractional frame, playhead, loop/range/snap and precise display.

### P02 — Channel registry and key states

- Bone/slot/attachment/draw-order/event/sequence/deform/constraint channels.
- Auto Key, Key Edited, Key Shown, state colors, scope preview.

### P03 — Dopesheet rows and virtualization

- Overview/bone/property/other hierarchical rows, counts/icons/collapse.
- Lock/pin/filter/current-tool/current-skin/reveal; large project budget.

### P04 — Selection and key transforms

- Click/toggle/all/box/persistent range selection.
- Move/scale/reverse/duplicate/delete/snap with pivot/collision/live preview.
- Viewport edits retain target time/selection semantics.

### P05 — Clipboard, shift, offset and cleanup

- Type-aware cut/copy/paste, target mapping/conflict preview, atomic undo.
- Ripple shift, loop wrap/offset, redundant-key cleanup, layered protection.

### P06 — Events and audio

- Definition/default/override/folders/runtime paths.
- int/float/string/audio path/volume/balance; visibility/mute/log/waveform hook.
- Deterministic crossing for seek/loop/reverse and video export timing contract.

### P07 — Advanced channels

- Separate X/Y, inheritance, two-color/alpha, draw-order folders multi-track.
- Sequence frame/mode/FPS; weighted/unweighted deform.
- IK/transform/path/physics/slider properties and Key Constrained capture.

### P08 — Dopesheet/Graph sync

- Dopesheet-centric, graph-centric and off modes.
- Shared selection/playhead/channel registry; no duplicated curve semantics.

## Integration slice

Walk/run/attack → transform/slot/draw-order folder → event+audio+sequence+deform
→ constraint/slider keys → multi-edit/cleanup/offset → save/reopen/playback.

## Gate

- All channel types create/edit/delete/clipboard/undo and round-trip.
- Event crossing and sequence FPS regressions pass.
- Dopesheet benchmark and browser workflow pass.
- No animation feature requires JSON/manual code.
