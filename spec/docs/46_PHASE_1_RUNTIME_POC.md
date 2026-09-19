# 46 — Phase 1: Runtime Proof and Dual-Format Viewer

## Goal
Demonstrate that simple Spine 3.8.75 and DragonBones skeletons normalize into the same canonical model and run through one runtime/render path.

## Entry
P0 gate green.

## Scope
Included:
- bones
- slots
- region attachments
- setup pose
- basic animation
- linear/stepped/Bezier
- basic events
- Pixi region renderer.

Excluded:
- weighted meshes
- deform
- full constraints.

## A — Runtime compilation
P1-A01 compile IDs to dense indices.
P1-A02 compile parent indices.
P1-A03 setup pose buffers.
P1-A04 topological parent-first order.
P1-A05 runtime snapshot interfaces.

## B — Transform evaluation
P1-B01 local transform → affine.
P1-B02 normal inheritance.
P1-B03 required alternate inheritance modes.
P1-B04 negative scale/reflection cases.
P1-B05 world/local conversion helpers.

## C — Animation engine
P1-C01 compiled timelines.
P1-C02 binary search + cached cursor.
P1-C03 linear.
P1-C04 stepped.
P1-C05 cubic Bezier.
P1-C06 rotation interpolation.
P1-C07 loop/clamp.
P1-C08 event interval crossing.

## D — Spine 3.8 basic import
P1-D01 version detector.
P1-D02 source AST/schema.
P1-D03 bones.
P1-D04 slots.
P1-D05 skins/region attachment.
P1-D06 transform timelines.
P1-D07 slot/attachment timelines baseline.
P1-D08 exact 3.8.75 warning/profile.

## E — DragonBones basic import
P1-E01 version/armature detection.
P1-E02 bones/transforms.
P1-E03 slots/displays.
P1-E04 region attachments.
P1-E05 basic animation.

## F — Pixi renderer
P1-F01 renderer facade.
P1-F02 texture/atlas adapter.
P1-F03 region display.
P1-F04 slot color baseline.
P1-F05 explicit slot draw order.
P1-F06 debug bones/origins.

## G — Compatibility Lab app
Must:
- load a fixture;
- identify source/version;
- show diagnostics;
- preview animation;
- seek time;
- dump canonical JSON;
- dump pose snapshot;
- toggle debug skeleton.

## Parallelism
After runtime interfaces freeze:
- Spine parser;
- DragonBones parser;
- Pixi adapter;
- animation sampling
can proceed separately.

Transform semantics remain central-owner.

## Acceptance scenarios
1. Simple Spine 3.8.75 fixture renders and animates.
2. Equivalent DragonBones fixture renders through same runtime.
3. Negative-scale fixture produces expected numeric world matrices.
4. Bezier midpoint differs from linear as expected.
5. Loop-boundary event is emitted exactly once.

## Exit gate
- [ ] mandatory simple Spine 3.8.75 fixtures pass
- [ ] basic DragonBones fixtures pass
- [ ] same runtime used for both
- [ ] no source-version conditional in renderer
- [ ] transform numeric goldens stable
- [ ] curve tests stable
- [ ] event interval tests stable
- [ ] viewer usable as debugging tool

## Freeze F1
Runtime pose, animation-channel and renderer-snapshot contracts become change-controlled.
