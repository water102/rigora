# 25 — Algorithm Catalog and Selection Policy

This document is the default algorithm decision table for HNN Bones.

The goal is not to implement every algorithm ourselves. The goal is to know **which mathematical problem is being solved**, choose a default algorithm deliberately, and hide third-party implementations behind local interfaces.

---

## 1. Selection rules

For every algorithmic subsystem, prefer in this order:

1. **Existing permissively licensed library** with stable API and adequate behavior.
2. **Extract/adapt permissively licensed DragonBones logic** when semantics match our target.
3. **Small clean-room implementation** when the domain behavior is specific to skeletal animation.
4. **Worker/WASM implementation** only after profiling.
5. Never copy official Spine runtime implementation.

Every non-trivial algorithm must have:
- input/output contract;
- invariants;
- complexity note;
- numerical tolerance;
- deterministic test;
- replacement interface.

---

## 2. Master algorithm matrix

| Problem | Default | Library / implementation | Complexity / notes |
|---|---|---|---|
| Bone hierarchy evaluation | topological parent-first traversal | custom | O(B) |
| World transform composition | 2×3 affine matrices | custom/gl-matrix helpers | O(B) |
| Matrix inverse | analytic affine inverse | custom | O(1), singular guard |
| Animation key lookup | binary search + cached cursor | custom | O(log K), often amortized O(1) |
| Linear interpolation | lerp | custom | O(1) |
| Rotation interpolation | semantic-aware angular interpolation | custom | O(1) |
| Cubic easing | cubic Bezier | bezier-js or local fast evaluator | O(iterations) for inversion |
| IK one bone | analytic angle solve | custom / DragonBones-derived | O(1) |
| IK two bone | analytic law-of-cosines | custom / DragonBones-derived | O(1) |
| IK long chain | FABRIK | custom optional | O(iterations × chain length) |
| Mesh skinning | Linear Blend Skinning | custom typed-array loop | O(V × influences) |
| Vertex neighbor lookup | adjacency lists | custom | O(E) build, O(degree) query |
| Spatial hit test | R-tree | rbush | approximately O(log N + M) |
| Polygon triangulation | ear clipping variant | earcut | practical fast |
| Point-set triangulation | Delaunay | delaunator | O(N log N) |
| Polygon boolean | sweep-line polygon clipping | polygon-clipping | library |
| Point in polygon | ray casting / winding | custom/library | O(N) |
| Segment intersection | orientation/cross-product | custom | O(1) |
| Nearest segment | projection/clamp | custom | O(1) |
| Polyline simplification | Ramer–Douglas–Peucker | custom/library | typical O(N log N), naive worst O(N²) |
| Alpha contour extraction | marching squares | library/custom | O(W×H) |
| Auto-weight V1 | inverse-distance to bone segments | custom | O(V×candidate bones) |
| Auto-weight advanced | diffusion/harmonic-style solver | later | higher cost, worker/WASM |
| Weight smoothing | graph Laplacian neighborhood average | custom | O(E) per pass |
| Weight normalization | positive clamp + normalized sum | custom | O(influences) |
| Path position | arc-length LUT + local solve | custom/bezier-js | preprocess + fast lookup |
| Path tangent | derivative of Bezier | bezier-js/custom | O(1) |
| Spring physics | semi-implicit Euler or Verlet-family solver | clean-room custom | O(constraints) per fixed step |
| Texture atlas | MaxRects | maxrects-packer | offline/worker |
| Undo delta compression | sparse before/after deltas | custom | proportional to changed data |
| Timeline range query | sorted arrays + binary search | custom | O(log K + M) |
| Render ordering | stable slot-order array | custom | O(S) |
| Dirty propagation | dependency flags | custom | O(changed subtree) |
| Project checksums | SHA-256 | WebCrypto/Tauri | streaming where possible |

---

## 3. Algorithm ownership categories

### CATEGORY A — Domain-critical, keep under our control
These algorithms define compatibility semantics:
- transform composition/inheritance;
- animation evaluation;
- IK/constraint order;
- skinning semantics;
- deform semantics;
- path-constraint semantics;
- physics semantics;
- version normalization.

Third-party helpers may be used, but HNN owns the behavior contract.

### CATEGORY B — Geometry utilities, prefer libraries
- triangulation;
- Delaunay;
- polygon boolean;
- Bezier utility operations;
- R-tree indexing;
- atlas packing.

### CATEGORY C — Infrastructure
- ZIP;
- workers;
- IndexedDB;
- UI docking;
- tree virtualization.

Use libraries almost entirely.

---

## 4. Determinism

The same canonical project, time, animation state and fixed physics step must produce the same canonical pose within documented floating-point tolerance.

Do not make semantic behavior depend on:
- object hash iteration;
- browser frame rate;
- wall-clock time;
- renderer order outside explicit slot/constraint ordering.

---

## 5. Numerical policy

Use:
- finite-number validation at format boundary;
- epsilon comparisons;
- singular matrix detection;
- clamping before `acos`;
- normalized angles only where semantics allow;
- stable weight normalization;
- fixed-step integration for physics.

Suggested constants must be centralized:

```ts
export const EPS = {
  transform: 1e-8,
  length: 1e-8,
  weight: 1e-6,
  angle: 1e-7,
  curve: 1e-6,
};
```

Do not scatter magic epsilons through code.

---

## 6. Algorithm change policy

Changing an algorithm that affects output requires:
1. ADR or compatibility note;
2. all golden fixtures;
3. numeric diff report;
4. visual diff report if applicable;
5. benchmark comparison.

A “better” algorithm is not automatically compatible.
