# 38 — Implementation Spec: Path Attachments and Path Constraints

---

## 1. Core separation

Path geometry and path constraint are separate:

```text
PathAttachmentData
 -> CompiledPathGeometry
 -> PathSampler
 -> PathConstraintSolver
```

The solver must not parse raw source-format path arrays.

---

## 2. Compiled path representation

```ts
interface CompiledPath {
  closed: boolean;
  constantSpeed: boolean;
  segments: CubicSegment[];
  cumulativeLength: Float32Array;
  totalLength: number;
}
```

Weighted path vertices are evaluated into current world control points before sampling.

---

## 3. Cubic segment

```ts
interface CubicSegment {
  p0: Vec2;
  p1: Vec2;
  p2: Vec2;
  p3: Vec2;
}
```

Source adapter/runtime compiler is responsible for turning path data into segment control points.

---

## 4. Arc length LUT

For each segment:
1. adaptive sample or fixed high-quality sample;
2. calculate cumulative distances;
3. store `(t, length)` pairs.

Recommended V1:
- adaptive subdivision based on flatness tolerance;
- cap recursion/subdivision count.

Pseudo:

```ts
function buildArcTable(curve, tol): ArcEntry[] {
  const entries = [{t:0, s:0}];
  recursivelySubdivide(0, 1, p0, p1, p2, p3, tol, entries);
  accumulateDistances(entries);
  return entries;
}
```

Use `bezier-js` if it provides reliable length/split APIs, but wrap it.

---

## 5. Distance -> t

```ts
function parameterAtDistance(table, targetS) {
  const i = binarySearchCumulativeLength(table, targetS);
  const a = table[i];
  const b = table[i+1];

  const u = (targetS-a.s)/(b.s-a.s);
  let t = lerp(a.t, b.t, u);

  // optional Newton refinement
  return refineIfUseful(t);
}
```

Guard zero-length interval.

---

## 6. Closed path

Normalize distance:

```ts
s = ((s % totalLength) + totalLength) % totalLength
```

For open paths:
- clamp or apply source-defined before/after behavior.

Canonical path sampler must state this explicitly.

---

## 7. Tangent

Cubic derivative:

```text
B'(t) =
3(1-t)^2(P1-P0)
+ 6(1-t)t(P2-P1)
+ 3t^2(P3-P2)
```

Angle:
```text
atan2(dy, dx)
```

If derivative length < epsilon:
- sample nearby t ± delta;
- fallback to previous valid tangent;
- diagnose fully degenerate path if necessary.

---

## 8. Constraint pipeline

Inputs:
- constrained bone chain
- target path attachment
- position
- spacing
- position mode
- spacing mode
- rotate mode
- translate mixes
- rotate mix

Algorithm outline:

```text
evaluate current path geometry
 -> derive requested distance for first bone
 -> derive spacing distances
 -> sample position/tangent for each required point
 -> compute desired bone transforms
 -> mix into current bone transforms
 -> update affected descendants/world matrices
```

---

## 9. Position modes

Canonical enum example:
- fixed distance
- percent of total length

Normalize source mode into canonical explicit unit.

Do not keep ambiguous numeric field with hidden mode interpretation.

---

## 10. Spacing modes

Possible canonical forms:
- fixed distance
- percent
- bone-length-based

Normalize before solver.

---

## 11. Rotate modes

Separate strategies:
- tangent
- chain
- chain-scale

Use Strategy pattern.

`chain-scale` may adjust bone scale based on sampled point distance.

---

## 12. Path cache invalidation

Invalidate compiled/current path when:
- path control vertices deform
- weighted path bone transforms change
- attachment switches
- topology changes

Static unweighted path can reuse compiled LUT longer.

Weighted/deformed path may need dynamic length recomputation depending source semantics.

---

## 13. Constant speed

If constant speed true:
- sample by arc length.

If false:
- source semantics may use precomputed lengths or parameterization rules.

Do not force every path to constant-speed arc-length sampling.

This is a compatibility-sensitive branch and needs fixtures.

---

## 14. Weighted path

Pipeline:

```text
base weighted control vertices
 -> deform
 -> skin with bones
 -> world control points
 -> rebuild dynamic curve geometry
 -> sample
```

This can be expensive.
Cache only while dependencies unchanged.

---

## 15. Constraint mixing

Apply:
- position mix X/Y separately if canonical model allows;
- rotation mix with angle-aware interpolation;
- scale mix for chain-scale.

Do not overwrite authored local transforms.
Constraint operates on runtime pose.

---

## 16. Required fixtures

- straight open path
- cubic high curvature
- closed loop
- percent position
- fixed spacing
- percent spacing
- chain rotate
- tangent rotate
- chain-scale
- weighted path
- deformed path
- zero-length segment
- negative position on closed path
- position > path length
- reflected parent hierarchy
