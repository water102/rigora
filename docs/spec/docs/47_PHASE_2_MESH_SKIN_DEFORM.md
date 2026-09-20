# 47 — Phase 2: Mesh, Skin, Weight and Deform Runtime

## Goal
Complete the runtime path required for real skeletal characters.

## Entry
P1 green and F1 stable.

## A — Canonical/compiled mesh
- validate vertices/UVs/triangles;
- choose Uint16/Uint32 indices;
- flatten sparse influences;
- keep base geometry immutable;
- establish authored/base bounds.

## B — Spine 3.8 mesh import
Separate tasks:
- unweighted vertices;
- weighted packed vertices;
- UV;
- triangles/hull;
- linked mesh;
- deform linkage.

Every task must include a fixture.

## C — DragonBones mesh import
Map:
- vertices
- UVs
- triangles
- weights
- slotPose
- bonePose
- shared mesh
- inheritDeform.

## D — CPU skinning
Implement doc 37:
- unweighted transform path;
- sparse LBS;
- reusable typed arrays;
- no per-frame nested-object construction.

Sanity invariant:
one influence of weight 1.0 equals rigid bone transform.

## E — Deform
- canonical deform timeline;
- Spine deform normalization;
- DragonBones FFD normalization;
- sparse interpolation;
- linked-mesh inheritance;
- runtime deform buffer.

## F — Skins
- skin activation;
- attachment lookup;
- fallback rules;
- cross-skin linked mesh;
- stable IDs.

## G — Atlas
Fixtures:
- normal region;
- rotated region;
- trim/offset as required;
- missing region diagnostic.

Atlas corrections belong in adapter/asset layer, not source-format branches inside renderer.

## H — Clipping
- canonical clipping attachment;
- Pixi-compatible clipping strategy;
- start/end slot semantics;
- degenerate polygon handling.

## I — Performance
Benchmarks:
- 5k vertices
- 20k vertices
- 50k stress

Record:
- pose evaluation;
- skinning CPU;
- GPU buffer upload;
- total frame.

Do not move to WASM without measured need.

## Exit gate
- [ ] Spine 3.8.75 weighted mesh corpus green
- [ ] DragonBones weighted mesh corpus green
- [ ] linked mesh corpus green
- [ ] deform/FFD corpus green
- [ ] skin-switch corpus green
- [ ] rotated atlas corpus green
- [ ] reflection + weighted mesh green
- [ ] clipping baseline green
- [ ] no mesh-object recreation each frame
- [ ] performance report exists

## Freeze F2
Mesh, weights, deform and attachment-runtime semantics become change-controlled.
