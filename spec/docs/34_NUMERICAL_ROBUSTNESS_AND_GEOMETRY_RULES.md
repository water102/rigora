# 34 — Numerical Robustness and Geometry Rules

## 1. Never compare floats with `===` for geometry

Use domain-specific epsilon.

## 2. Scale-aware epsilon

Absolute epsilon alone fails for very large/small skeletons.

Define project scale:
- median or representative bone length;
- or explicit units scale.

Use:
```text
eps_position = max(baseEps, relativeEps * projectScale)
```

## 3. Safe normalize

```ts
if (len < eps) return fallbackDirection;
```

Never divide blindly.

## 4. Safe acos

```ts
acos(clamp(x, -1, 1))
```

Floating error frequently pushes x slightly outside range.

## 5. Orientation predicate

For geometry:
```text
cross((b-a),(c-a))
```

Use epsilon for near-collinear classification.

## 6. Degenerate triangles

Reject:
- repeated vertex IDs;
- near-zero area.

They cause unstable barycentric calculations and rendering artifacts.

## 7. Singular transforms

Near-zero scale can make inverse unavailable.
Tool behavior:
- block operation requiring inverse;
- show diagnostic;
- do not generate Infinity/NaN.

## 8. NaN containment

Validate external data at adapter boundary.
Runtime debug builds should assert finite matrices after each major pipeline stage.

## 9. Stable normalization of weights

After normalizing, force residual onto the largest influence:

```text
residual = 1 - sum(normalized)
largest += residual
```

This keeps sums numerically close to exactly 1 for serialization/runtime.

## 10. Deterministic sorting

Whenever equal sort keys exist, use stable secondary key:
- authored order;
- stable ID.

Do not depend on incidental JS object order.

## 11. Geometry units

Canonical model should not mix:
- pixels;
- normalized UV;
- frames;
- seconds;
- degrees/radians.

Types/naming should make units clear.

Suggested branded types at API boundaries if helpful:
```ts
type Seconds = number & {__brand:"Seconds"};
type Radians = number & {__brand:"Radians"};
```

Avoid overusing branded types in hot runtime code.
