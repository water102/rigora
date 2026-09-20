# 31 — Data Structures and Performance Patterns

## 1. Principle

Choose data structures based on access patterns, not aesthetic preference.

---

## 2. Authored model

Use object-rich, readable TypeScript data:
- stable IDs;
- arrays in deterministic authored order;
- maps/indexes built as caches.

Do not serialize `Map`, RBush trees, Pixi objects or runtime typed arrays directly.

---

## 3. Runtime indices

At instantiation:
- map stable IDs/names to dense integer indices;
- bones -> `[0..B-1]`;
- slots -> `[0..S-1]`.

Hot runtime buffers use integer references.

This avoids repeated Map/string lookup per frame.

---

## 4. Struct of Arrays for hot data

Candidate:

```text
boneA[]
boneB[]
boneC[]
boneD[]
boneTx[]
boneTy[]
```

instead of:

```text
BoneRuntime[]
```

Do not force SoA everywhere. Use it where profiler shows meaningful gain.

---

## 5. Typed arrays

Use:
- Float32Array for GPU-aligned pose/vertex buffers where precision is adequate;
- Uint16Array/Uint32Array for indices depending on vertex count;
- Int32Array for bone indices when appropriate.

Canonical serialization remains normal JSON numbers.

---

## 6. Timeline storage

Per channel:
- sorted `times[]`
- values
- curve data

Optional compiled runtime representation avoids object keyframes.

Precompile canonical authoring timelines into a runtime clip.

---

## 7. Binary search + cursor

Each active runtime channel can keep last key index.
If time increases and remains within next interval, no binary search.

On seek/wrap:
- binary search.

---

## 8. Adjacency lists

Mesh:
```text
vertex -> neighbor vertex IDs
vertex -> triangle IDs
edge -> adjacent triangles
```

Rebuild after topology changes.

Supports:
- smoothing;
- connected select;
- soft selection;
- topology validation.

---

## 9. Spatial index

RBush stores screen/world bounding boxes for:
- vertices;
- bones/gizmos;
- path handles;
- faces optionally.

Rebuild strategy:
- bulk rebuild after major topology transform;
- incremental updates during local edits only if needed.

---

## 10. Stable IDs vs dense runtime IDs

Authored:
```text
"01J..."
```

Runtime:
```text
17
```

Never expose dense runtime index as persistent identity.

---

## 11. Dirty flags

Useful flags:
- local transform dirty
- world transform dirty
- geometry dirty
- UV dirty
- weights dirty
- GPU buffer dirty
- bounds dirty

Centralize invalidation rules.

---

## 12. Caching

Safe caches:
- path arc-length LUT
- adjacency
- world bounds
- compiled animation clips
- triangulation
- atlas lookup
- spatial tree

Every cache must document invalidation dependencies.

Stale cache bugs are compatibility bugs.

---

## 13. Worker boundary

Worker tasks should have coarse payloads:
- auto mesh
- auto weights
- atlas packing
- project compression
- large import normalization
- physics bake

Avoid sending tiny high-frequency mouse events to workers.

Use Transferable ArrayBuffers when payload is large.

---

## 14. Copy-on-write / sparse deltas

Undo for mesh/weights:
- record only changed vertices/weights;
- compress consecutive stroke updates;
- store before and after values.

Do not clone complete 100k-vertex meshes per brush stroke.

---

## 15. Performance instrumentation

Expose dev counters:
- bones evaluated
- constraints evaluated
- vertices skinned
- GPU buffer uploads
- key searches
- worker jobs
- cache hits/misses
- frame CPU times

Optimization without counters is guesswork.
