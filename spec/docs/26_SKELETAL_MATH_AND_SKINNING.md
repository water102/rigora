# 26 — Skeletal Math, Transforms and Skinning Algorithms

## 1. Purpose

This document specifies the math layer used by the runtime. It complements `04_TRANSFORM_SEMANTICS.md`.

---

## 2. Affine transform representation

Runtime matrix:

```text
| a c tx |
| b d ty |
| 0 0  1 |
```

For point `(x, y)`:

```text
x' = a*x + c*y + tx
y' = b*x + d*y + ty
```

Store hot matrices in flat typed arrays when profiling justifies it:

```text
[a, b, c, d, tx, ty]
```

---

## 3. Parent-child composition

For ordinary inheritance:

```text
M_world(child) = M_world(parent) × M_local(child)
```

But transform inheritance modes may alter rotation/scale/reflection semantics. These modes must be explicit strategies rather than ad-hoc matrix edits.

Recommended abstraction:

```ts
interface TransformInheritanceStrategy {
  compose(parentWorld: Mat2D, childLocal: Transform2D, out: Mat2D): void;
}
```

Implement one strategy per canonical inheritance mode.

---

## 4. Dirty transform propagation

Do not recompute the full hierarchy after every editor drag if only a subtree changed.

Each bone has:
- local dirty;
- world dirty;
- descendants dirty.

When local changes:
1. mark bone world dirty;
2. mark descendants world dirty;
3. evaluate lazily or in next pose update.

Runtime full animation playback may simply evaluate all bones parent-first if O(B) is cheaper than dirty bookkeeping at typical character size. Editor idle manipulation benefits more from dirty propagation.

---

## 5. Matrix inverse

For:

```text
det = a*d - b*c
```

if `abs(det) < EPS.transform`, treat as singular.

Inverse of affine 2×3 is analytic; no generic matrix solver is needed.

Used for:
- world -> local conversion;
- reparent while preserving world pose;
- gizmo transforms;
- weight/bind-space conversion.

---

## 6. Reparent preserving world transform

Goal: move bone from parent A to parent B without visually moving it.

```text
M_local_new = inverse(M_world_parentB) × M_world_old
```

Then decompose only for authored transform fields.

Because decomposition may be ambiguous under reflection/shear:
- preserve matrix first;
- choose decomposition policy deterministically;
- emit warning if exact parameter representation is impossible.

---

## 7. Linear Blend Skinning (LBS)

Default weighted mesh algorithm.

For vertex `v` with influences `(bone_i, weight_i)`:

```text
v_world = Σ_i weight_i * (M_i * v_bind_i)
```

where `M_i` represents the appropriate bind-to-current transform.

Requirements:
- clamp invalid negative weights at import or diagnose according to source semantics;
- normalize sum when canonicalizing;
- preserve zero-influence vertices as rigid/local vertices;
- support per-influence local bind position if source format needs it.

Runtime data layout should favor contiguous arrays:

```text
vertexOffsets[]
influenceBoneIndex[]
influenceWeight[]
influenceX[]
influenceY[]
```

rather than nested JS objects in hot loops.

---

## 8. Influence count

Do not force a universal 4-bone limit in canonical authoring data.

For runtime export, optional optimization may reduce influences:
1. sort descending;
2. keep top N;
3. renormalize;
4. compare error;
5. warn if error threshold exceeded.

---

## 9. Deform / FFD

Canonical evaluation order:

```text
base vertex
  -> deform offset in the correct semantic space
  -> weighted bone transforms
  -> attachment/world transform
```

The exact placement of deformation relative to weighting is source-version-sensitive and must be verified by fixtures.

Never overwrite base mesh positions during animation.

---

## 10. Color interpolation

Use straight numeric interpolation in canonical color channels unless source semantics differ.

Decide once whether runtime color values are:
- linear-space;
- sRGB-like numeric channels.

For compatibility-oriented sprite animation, preserve source numeric semantics; do not introduce color-management transformations accidentally.

---

## 11. Angular interpolation

Avoid naïvely:

```ts
lerp(a, b, t)
```

for rotations crossing ±π.

Use semantic angular delta:

```text
delta = wrapToSemanticRange(b - a)
angle = a + delta*t
```

But imported timeline formats may encode rotation accumulation/spin behavior. The importer must normalize that explicitly.

---

## 12. Testing

Mandatory math property tests:
- `M × inverse(M) ≈ I`
- point round-trip local -> world -> local
- parent chain equivalence
- reflected parent
- zero/near-zero scale handling
- reparent preserving world pose
- weight sum normalization
- rigid one-weight skinning equals bone transform
- two-weight midpoint sanity case
