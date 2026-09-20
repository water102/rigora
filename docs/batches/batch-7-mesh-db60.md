# Batch 7 — Mesh foundation and DB6 recognition

This batch follows the priorities in [the approved LoongBones addendum](../plans/loongbones-spec-addendum.md), informed by `research/loongapp/analysis.md`. The supplied research and original spec are not edited. The archived DragonBones version string was inspected as supporting inventory evidence; no archived implementation code or media is copied into production packages.

## Implemented

- Exported `meshAttachmentSchema`, `weightedVertexSchema`, `MeshAttachment`, `WeightedVertex`, and `WeightedInfluence` from `@rigora/model`, reusing the existing canonical mesh representation.
- Schema checks require finite geometry and weights, nonnegative weights, and safe integer triangle indices.
- Skeleton invariants check triangle index triples, range, repeated indices, scale-relative nonzero area, vertex/UV count, optional weighted/authored vertex count, hull length, unique influence bones, reference validity, weight sums, and linked-mesh cycles. Validation diagnoses errors without normalizing or pruning data.
- `detectDragonBonesVersion` distinguishes 5.5, 6.0, unknown families and malformed/missing versions. Exact 6.0.001 and 6.0.2 remain distinct strings.
- `inspectDragonBonesExtensions` reports `physicsConstraint` and `pathConstraint` at root, armature and bone locations, not arbitrary user metadata. It reports field presence even when empty/null; no semantics are assumed.
- Existing `importDragonBones55` invokes recognition before normalization. A 6.0 source returns `DB60_UNSUPPORTED_VERSION` plus every recognized `DB60_UNSUPPORTED_FEATURE` pointer. A source labeled 5.5 containing these extensions also fails explicitly. Strict, compatible and repair modes all preserve this behavior. A failed import never returns partial skeletons.

## Contract for subsequent batches

Canonical meshes keep geometry, UVs, weights and deform data separate. Sparse authored influences reference stable bone IDs; dense indices belong to compilation. UVs are finite but not restricted to [0,1], allowing atlas/repeat policies at their own boundary. A linked mesh may carry empty local geometry and refer to a validated parent; this batch checks references and cycles, not linked topology compilation.

Batch 8 must lock bind/deform spaces with numeric fixtures before implementing LBS. The addendum's schematic post-skin deform formula must not erase the per-influence versus per-vertex distinction required by spec 37. Runtime geometry should retain canonical Y-up coordinates; the renderer remains responsible for screen conversion as in Batch 6. BBW and triangulation belong to authoring workers, not runtime skinning.

Raw library downloads are research material, not approved build dependencies. Before the proposed Batch 10 worker integration, verify exact upstream provenance and license terms for each archived solver/triangulator. No claim in the research inventory is substituted for that dependency review. No new dependencies or runtime algorithms are introduced in Batch 7.

## Validation and limits

Synthetic weighted-mesh and DB6 diagnostic fixtures are independently authored and labeled CC0. Tests cover sparse-weight snapshot round-trip, duplicate influences, degenerate/index-invalid triangles, scale range, linked cycles, complete constraint diagnostics, misleading 5.5 labels, version families and transactionality. Existing setup preview remains a regression target.

Still pending: mesh source import, LBS, deform timeline sampling, Pixi mesh buffers, actual LoongBones-export goldens, imported animation playback and the P1 architectural proof gate. This batch does not claim DragonBones 6 runtime or binary/AMF support. The next addendum batch is Batch 8 (LBS and deform); previous P0/P1 gaps remain tracked rather than implicitly marked complete.
