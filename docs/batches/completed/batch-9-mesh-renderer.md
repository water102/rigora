# Batch 9 — Pixi Mesh Renderer

This batch implements the GPU mesh rendering stage defined in [the LoongBones addendum](../../plans/completed/loongbones-spec-addendum.md) and [Renderer Contract](../../contracts/renderer-contract.md).

## Implemented

- Exported `PixiMeshRenderer` and `MeshRenderItem` from `@rigora/renderer-pixi`.
- Wrapped PixiJS 8 `Mesh` and `MeshGeometry` with zero-allocation dynamic vertex buffers:
  - Canonical Y-up vertex positions are converted to screen Y-down (`y -> -y`) directly into persistent `Float32Array` buffers.
  - Subsequent evaluations reuse the existing `MeshGeometry` and call `getBuffer('aPosition').update()` without allocating new memory per frame.
  - Topological recreation only occurs if vertex counts change or attachment IDs change.
- Texture mapping:
  - Reuses textures from caller-provided `textures` map without owning or destroying them on renderer lifecycle teardown.
  - Rejects missing textures with `ASSET_TEXTURE_NOT_FOUND`.
  - Rejects non-finite coordinates with `RUNTIME_NON_FINITE_GEOMETRY`.
- Slot management:
  - Inactive mesh slots are automatically culled and their display objects destroyed.
  - Supports tinting (RGB hex), alpha opacity, and standard Pixi blend modes (`normal`, `additive`, `multiply`, `screen`).
- Wireframe / debug overlay:
  - When `debug: true`, draws triangle wireframes (`#debug.moveTo / lineTo`) and vertex points across deformed mesh topology, plus bone endpoints when passed a full `RenderSnapshot`.
- Setup Snapshot Mesh Evaluation:
  - Updated `@rigora/runtime.createSetupSnapshot` to evaluate `mesh` attachments using `MeshInstance` and populate `RenderSnapshot.meshes`.

## Limits and next steps

- Batch 10 (Studio Authoring Lab): Integrate automated mesh generation (`earcut`/`delaunator`) and BBW solver workers.
- Imported animation playback: Connecting continuous timeline sampling loop with `MeshInstance.sampleAndEvaluate` during active playback.
