# 50 — Phase 5: Animation Authoring

## Goal
Make ordinary skeletal animation authoring complete and testable.

## Entry
P4 green; P1 animation runtime stable.

## A — Animation management
Commands:
- create
- rename
- duplicate
- delete
- duration/FPS metadata.

## B — Timeline view model
Renderer-independent:
- rows/channels
- key IDs
- key selection
- playhead
- visible range
- zoom
- markers
- loop range.

## C — Dopesheet UI
Required:
- virtualized rows;
- multi-select;
- box select;
- move keys;
- duplicate;
- delete;
- copy/paste;
- frame snapping;
- playhead;
- auto-scroll;
- loop range.

Start with timeline library if suitable; retain view-model abstraction so key rendering can move to Canvas/Pixi.

## D — Auto-key
Modes:
- off
- changed property
- first-frame helper.

Every auto key is a normal undoable command.

## E — Playback
- play/pause
- next/previous frame
- seek
- loop
- speed
- frame/time display.

## F — Graph editor
- scalar/angle channels;
- linear/stepped/Bezier;
- Bezier handles;
- fit all/selection;
- grid;
- snap;
- numeric handle values;
- multi-key curve edit.

## G — Multi-key operations
- translate time;
- scale time around pivot;
- change values;
- copy/paste across compatible channels;
- duplicate.

One user gesture = one history transaction.

## H — Events
- definitions;
- event keys;
- payload fields;
- preview event log.

## I — Slot channels
- attachment switch
- color/two-color
- draw order.

## J — Constraint channels
- IK mix
- transform mixes
- path parameters
and later physics parameters.

## K — Performance
Normal: 10k keys.
Stress: 50k keys.
Measure pan/zoom, select and drag.

## Exit gate
- [ ] complete transform animation creation/editing
- [ ] linear/stepped/Bezier authoring
- [ ] graph editor functional
- [ ] multi-key operations undo correctly
- [ ] events work
- [ ] attachment/color/draw-order channels work
- [ ] constraint animation works
- [ ] 10k key case usable
- [ ] 50k stress outcome documented
