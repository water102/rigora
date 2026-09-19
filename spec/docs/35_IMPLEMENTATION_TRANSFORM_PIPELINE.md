# 35 — Implementation Spec: Transform Pipeline

This document is implementation-oriented. It specifies the minimum runtime/editor transform behavior expected from the canonical engine.

---

## 1. Required runtime structures

```ts
interface RuntimeBone {
  index: number;
  parentIndex: number; // -1 = root

  // setup/canonical authored data
  setup: Transform2D;
  inherit: TransformInheritance;

  // pose-local values after animation sampling
  localX: number;
  localY: number;
  localRotation: number;
  localScaleX: number;
  localScaleY: number;
  localShearX: number;
  localShearY: number;

  // evaluated world affine matrix
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;

  dirtyLocal: boolean;
  dirtyWorld: boolean;
}
```

Use dense integer parent indices at runtime.

---

## 2. Canonical local transform → affine matrix

Canonical transform uses:
- translation `(x, y)`
- rotation `r`
- scale `(sx, sy)`
- shear `(shx, shy)`

Do not assume `shearX = 0`.

Recommended conceptual construction:

```text
xAxisAngle = rotation + shearX
yAxisAngle = rotation + PI/2 + shearY
```

Then:

```text
a = cos(xAxisAngle) * scaleX
b = sin(xAxisAngle) * scaleX
c = cos(yAxisAngle) * scaleY
d = sin(yAxisAngle) * scaleY
tx = x
ty = y
```

This representation is convenient because each local axis has its own angle and scale.

Important:
- source adapters may normalize their source transform semantics into this canonical convention;
- do not assume Spine/DragonBones fields can be copied directly.

---

## 3. Standard parent composition

For normal inheritance:

```text
worldLinear = parentLinear × localLinear
worldTranslation = parentLinear × localTranslation + parentTranslation
```

Expanded:

```ts
function composeNormal(
  p: Mat2D,
  l: Mat2D,
  out: Mat2D
) {
  out.a  = p.a*l.a + p.c*l.b;
  out.b  = p.b*l.a + p.d*l.b;
  out.c  = p.a*l.c + p.c*l.d;
  out.d  = p.b*l.c + p.d*l.d;
  out.tx = p.a*l.tx + p.c*l.ty + p.tx;
  out.ty = p.b*l.tx + p.d*l.ty + p.ty;
}
```

Root:
```ts
world = local
```
plus any explicitly defined skeleton/global transform layer.

---

## 4. Inheritance Strategy interface

Do not implement inheritance with scattered conditions.

```ts
interface InheritanceEvaluator {
  compose(
    parent: ReadonlyMat2D,
    local: ReadonlyLocalTransform,
    out: MutableMat2D
  ): void;
}
```

Registry:

```ts
const inheritanceStrategies = {
  normal,
  onlyTranslation,
  noRotationOrReflection,
  noScale,
  noScaleOrReflection,
};
```

Each strategy must have its own golden tests.

---

## 5. Strategy: onlyTranslation

Semantics:
- inherit parent world translation;
- do not inherit parent rotation/scale/shear.

Conceptually:

```ts
outLinear = localLinear;
out.tx = parent.tx + local.x;
out.ty = parent.ty + local.y;
```

However, whether local translation itself is transformed by parent axes depends on source semantics before normalization.

Therefore:
- canonical `onlyTranslation` contract must be fixed;
- source adapters must normalize into it.

Recommendation:
canonical contract = translation is expressed in parent/world translation frame but does not rotate/scale with parent.

Test:
- parent rotated 90°
- child x=10
- expected canonical world position must be explicitly documented.

---

## 6. Strategy: noRotationOrReflection

Goal:
- preserve parent translation and useful scale-like influence;
- remove inherited rotation/reflection.

Implementation options:
1. decompose parent matrix;
2. construct filtered parent matrix;
3. compose filtered parent with child local.

Preferred:
- use a stable orthogonalization-based extraction instead of repeatedly converting through UI transform components.

Pseudo:

```ts
function removeRotationAndReflection(p: Mat2D): Mat2D {
  // derive effective axis magnitudes
  const sx = hypot(p.a, p.b);
  const det = p.a*p.d - p.b*p.c;

  // derive second axis magnitude with determinant sign handling
  const sy = sx > EPS ? det / sx : hypot(p.c, p.d);

  return {
    a: sx,
    b: 0,
    c: 0,
    d: abs(sy), // canonical policy must define reflection removal
    tx: p.tx,
    ty: p.ty
  };
}
```

This is conceptual. Exact source compatibility may require more nuanced handling and must be driven by fixtures.

---

## 7. Strategy: noScale / noScaleOrReflection

Use normalized parent axes rather than full parent matrix.

Pseudo:

```ts
xAxis = normalize([p.a, p.b])
yAxis = normalize([p.c, p.d])
```

But non-orthogonal/sheared parents require care.

Recommended method:
1. derive rotation basis from parent X axis;
2. derive handedness from determinant;
3. construct unit basis;
4. optionally preserve or remove reflection;
5. compose child local through that basis.

Do not normalize both arbitrary sheared axes independently and assume orthogonality.

---

## 8. Determinant and reflection

```text
det = a*d - b*c
```

- `det < 0` => reflected coordinate frame
- `abs(det) < epsilon` => near singular

Reflection influences:
- rotation interpretation
- IK bend direction
- path orientation
- mesh winding
- decomposition

Expose helper:

```ts
function isReflected(m: Mat2D): boolean {
  return determinant(m) < 0;
}
```

---

## 9. World → local conversion

For editor gizmos:

```text
localPoint = inverse(parentWorld) * worldPoint
```

If inverse unavailable:
- block transform edit that requires it;
- show diagnostic;
- do not approximate silently.

---

## 10. Reparent preserve pose

Pseudo:

```ts
function reparentPreserveWorld(
  bone: BoneData,
  oldWorld: Mat2D,
  newParentWorld: Mat2D
): Transform2D {
  const inv = inverse(newParentWorld);
  if (!inv) throw SingularTransformError;

  const localMatrix = multiply(inv, oldWorld);

  return decomposeForAuthoring(localMatrix, {
    preferredRotation: bone.setup.rotation,
    preserveReflection: true,
  });
}
```

`decomposeForAuthoring` must be deterministic.

---

## 11. Runtime evaluation order

Parent-first:

```ts
for (let i = 0; i < bones.length; i++) {
  const bone = bones[i];

  if (bone.parentIndex < 0) {
    localToMatrix(bone, boneWorld[i]);
  } else {
    const p = boneWorld[bone.parentIndex];
    inheritanceStrategies[bone.inherit].compose(
      p,
      boneLocal[i],
      boneWorld[i],
    );
  }
}
```

This requires runtime bones to be topologically sorted.

Importer/canonical validator must guarantee parent index < child index after compilation.

---

## 12. Compile step

Canonical authored order may be preserved for UI, but runtime compilation creates:
- topologically sorted bone array;
- `canonicalId -> runtimeIndex`;
- `runtimeIndex -> canonicalId`.

Do not rewrite user-visible hierarchy order purely for runtime performance.

---

## 13. Numerical guards

Every transform stage:
- assert finite numbers in debug mode;
- guard near-zero axis lengths;
- avoid `atan2(0,0)` assumptions;
- clamp decomposition ratios.

---

## 14. Mandatory tests

`xf_001_root`
`xf_002_parent_rotate`
`xf_003_parent_scale`
`xf_004_parent_negative_scale_x`
`xf_005_parent_negative_scale_y`
`xf_006_parent_double_reflection`
`xf_007_shear`
`xf_008_only_translation`
`xf_009_no_scale`
`xf_010_no_rotation_reflection`
`xf_011_reparent_preserve_world`
`xf_012_singular_parent`
`xf_013_deep_chain`
`xf_014_mixed_inheritance`

Acceptance is numeric world-matrix equivalence, not just visual similarity.
