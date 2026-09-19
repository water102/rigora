# 37 — Implementation Spec: Weighted Mesh and Deform

---

## 1. Canonical separation

Keep four concepts separate:

1. **base geometry**
2. **UV topology**
3. **weights/bind data**
4. **animation deform offsets**

Never bake deform into base geometry.

---

## 2. Runtime compiled mesh

Suggested:

```ts
interface CompiledMesh {
  vertexCount: number;

  // unweighted base
  baseXY?: Float32Array;

  // weighted representation
  influenceOffset?: Uint32Array; // len vertexCount+1
  influenceBone?: Uint16Array | Uint32Array;
  influenceWeight?: Float32Array;
  influenceLocalXY?: Float32Array;

  uvs: Float32Array;
  triangles: Uint16Array | Uint32Array;

  deformBuffer: Float32Array;
  worldXY: Float32Array;
}
```

`influenceOffset[v]..influenceOffset[v+1]` gives sparse influences of vertex v.

---

## 3. Weight compilation

Canonical:

```text
vertex
  influences [
    {boneId, weight, localPosition},
    ...
  ]
```

Compile:
- resolve boneId -> dense runtime index;
- normalize weights;
- flatten into contiguous arrays.

Reject unresolved bones.

---

## 4. LBS runtime loop

Conceptual:

```ts
for (let v = 0; v < vertexCount; v++) {
  let wx = 0;
  let wy = 0;

  const start = influenceOffset[v];
  const end = influenceOffset[v + 1];

  for (let j = start; j < end; j++) {
    const boneIndex = influenceBone[j];
    const w = influenceWeight[j];

    let x = influenceLocalXY[j*2];
    let y = influenceLocalXY[j*2+1];

    // apply deform according to canonical deform semantics
    [x, y] = applyDeformToInfluenceOrVertex(...);

    const m = boneWorld[boneIndex];

    wx += (m.a*x + m.c*y + m.tx) * w;
    wy += (m.b*x + m.d*y + m.ty) * w;
  }

  worldXY[v*2] = wx;
  worldXY[v*2+1] = wy;
}
```

Actual deform placement must follow canonicalized semantics, not be guessed here.

---

## 5. Unweighted mesh loop

```ts
for each vertex:
  local = base + deform
  world = slotBoneWorld * local
```

No need to route through weighted influence arrays.

---

## 6. Deform keyframe representation

Recommended canonical authoring shape:

```ts
interface DeformKeyValue {
  offset: number; // first affected scalar index or semantic vertex offset
  values: number[];
}
```

But runtime should compile into full or sparse typed arrays depending performance.

Important:
- canonical meaning of `offset` must be format-neutral;
- if source offset units differ, adapter converts them.

---

## 7. Sparse deform evaluation

Option A — full buffer per active mesh:
1. zero deform buffer;
2. apply interpolated sparse key;
3. skin.

Option B — sparse interpolation directly in skinning loop.

Start with A for correctness.
Optimize only after profiling.

---

## 8. Deform interpolation

For two keyframes:
- missing scalars = zero according to canonical sparse semantics;
- interpolate with normalized timeline curve;
- result goes into deform buffer.

Do not mutate keyframe arrays.

---

## 9. Linked/shared mesh

Canonical linked mesh stores:
- link target mesh ID;
- optionally inherits deform.

At compile:
- topology/UV/index buffers can be shared;
- deform ownership follows canonical flag.

Use flyweight/shared immutable geometry.

Cycle detection mandatory.

---

## 10. Mesh local bounds

For weighted mesh, static local bounds may not represent runtime pose.
Maintain:
- authored/base bounds
- runtime world bounds computed when requested

Avoid recomputing exact world bounds every frame unless needed for culling.

---

## 11. GPU strategy

V1:
- CPU skinning
- upload updated position buffer to Pixi mesh

Why:
- simplest cross-format semantics
- easier debugging
- editor needs CPU positions for picking/bounds

Later:
- GPU skinning optional
- retain CPU path as reference/oracle

---

## 12. GPU upload dirtying

Only upload:
- positions when pose/deform changes
- UVs when UV/atlas mapping changes
- indices when topology changes

Do not recreate Pixi Mesh objects every frame.

---

## 13. Weight editing invariants

After authoring command:
- all weights finite
- non-negative unless explicit source semantics allow otherwise
- sum ~= 1
- no duplicate influence bone per vertex
- locked influences respected
- zero-weight influences optionally pruned

---

## 14. Pruning

Configurable threshold:
```text
if weight < epsilonWeightPrune -> remove
```

After prune:
- renormalize
- ensure at least one influence

Pruning is an explicit editor/optimization operation, not silent import behavior.

---

## 15. Weight brush pseudocode

```ts
beginStroke() {
  touchedBefore = new Map();
}

applyBrush(pointerWorld) {
  const candidates = spatialIndex.query(circleBounds(pointerWorld, radius));

  for (const vertexId of candidates) {
    const d = worldDistance(vertexId, pointerWorld);
    if (d > radius) continue;

    rememberOriginalOnce(vertexId);

    const t = 1 - d/radius;
    const falloff = smoothstep01(t);
    addWeight(vertexId, activeBoneId, strength * falloff * dtOrSampleFactor);
    normalizeVertex(vertexId);
  }
}

endStroke() {
  const after = snapshotTouched();
  commit(new WeightStrokeCommand(before, after));
}
```

Brush semantics should be event-sample independent.
Prefer accumulating based on pointer path distance or fixed sampling, not raw browser event frequency.

---

## 16. Smooth pseudocode

```ts
for each selected vertex v:
  for each relevant bone b:
    avg = average(weight(n,b) for n in neighbors(v))
    next(v,b) = lerp(weight(v,b), avg, alpha)

apply all next values simultaneously
normalize
```

Never update in place during iteration or result becomes traversal-order dependent.

---

## 17. Auto weight V1 pseudocode

```ts
for vertex v:
  candidates = nearbyBoneSegments(v, maxCandidates)

  scores = []
  for bone in candidates:
    d = distancePointToSegment(v, bone.segment)
    s = 1 / pow(d + eps, p)
    scores.push({bone, s})

  scores = topN(scores, maxInfluences)
  normalize scores to weights
```

Optional visibility/geodesic penalty can be added later.

---

## 18. Error metrics for influence reduction

When reducing influences:
- sample representative poses
- compare resulting world vertex position
- use max pixel/world error

Do not choose top-4 solely by static weight if quality-critical export is desired.

---

## 19. Required tests

- rigid single influence
- two equal influences
- zero deform
- sparse deform
- linked mesh inherit deform true/false
- negative scale parent
- rotated atlas UV
- mesh topology edit preserves IDs
- weight brush deterministic stroke
- smoothing order independence
- influence prune + renormalization
