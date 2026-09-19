# 04 — Transform and Coordinate Semantics

Transform semantics are the highest-risk compatibility area.

## 1. Canonical coordinate convention

Recommended:
- X positive right
- Y positive up in canonical math
- angles positive counter-clockwise
- internal angles in radians
- transforms stored local-to-parent
- affine world matrix is 2×3
- renderer adapter handles Y inversion if screen coordinates require it

Alternative conventions are acceptable only if chosen once and covered by all adapters.

## 2. Matrix form

```text
| a c tx |
| b d ty |
| 0 0  1 |
```

Represent as six floats.

## 3. Transform decomposition

Do not assume every affine matrix decomposes uniquely into rotation/scale/shear.
Negative scale and reflections are especially sensitive.

The model SHALL distinguish:
- authored transform values
- evaluated matrix
- decomposed values used for UI only

Never repeatedly decompose/recompose during playback.

## 4. Negative scale

Golden tests are mandatory for:
- parent scaleX = -1
- parent scaleY = -1
- both negative
- IK under reflection
- mesh under reflection
- clipping under reflection

## 5. Rotation wrapping

Canonical interpolation SHOULD use shortest-path rules only when target format semantics require it.
Importer must preserve explicit spin direction where external semantics encode it.

## 6. Shear/skew

DragonBones exposes `skX/skY`; Spine represents transforms with rotation/shear concepts that differ by version.
Adapters SHALL convert through documented semantic equations, not simple field renaming.

## 7. Transform inheritance

Canonical enum should cover a superset:

```ts
type TransformInheritance =
  | "normal"
  | "onlyTranslation"
  | "noRotationOrReflection"
  | "noScale"
  | "noScaleOrReflection"
  | "customPreserved";
```

Adapters map external transform modes to canonical semantics.

## 8. Constraint ordering

Constraint order SHALL be explicit.
Never rely on object insertion order.

## 9. Precision

Use JavaScript Number for authored values and Float32Array for runtime hot buffers where beneficial.

Round-trip export tolerance:
- positions: configurable, default 1e-4 canonical units
- angles: 1e-5 rad
- weights: 1e-5
- UVs: 1e-6

## 10. Conversion test method

For every transform fixture:
1. parse source;
2. evaluate setup pose;
3. sample animations at fixed timestamps;
4. compare world matrices;
5. compare transformed attachment vertices;
6. compare screenshot hashes with tolerance.

Field equality is insufficient; world-space behavior is the truth.
