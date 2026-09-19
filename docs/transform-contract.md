# Batch 3 canonical transform contract

Implementation: `packages/math/src/index.ts`. Coordinates remain X right, Y up, CCW radians. Matrices are `[a, b, c, d, tx, ty]`; columns describe the local X/Y axes. Each authored axis uses its own shear angle. Inputs are immutable to operations; outputs are fresh objects.

The following resolves the policy choices explicitly left open by spec document 35. These are canonical rules, not a claim of source-runtime equivalence. Source adapters must normalize into these rules and verify against source fixtures.

| Inheritance            | Parent frame applied to child axes AND translation                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| normal                 | Full parent affine matrix                                                                                             |
| onlyTranslation        | Identity linear part, parent translation; parent at (2,3) rotated 90 degrees and child at (10,0) gives (12,3)         |
| noRotationOrReflection | Diagonal scale: X-axis length and absolute perpendicular Y residual; removes inherited shear, rotation and reflection |
| noScale                | Orthogonal unit basis from parent X, preserves determinant handedness                                                 |
| noScaleOrReflection    | Same unit basis, always right-handed                                                                                  |

For noScale variants, if X is below the relative axis threshold, derive a right-handed frame from Y. A fully collapsed parent raises `CORE_SINGULAR_TRANSFORM`. `customPreserved` raises `CORE_UNSUPPORTED_INHERITANCE`, including at a root.

Inversion normalizes linear entries by their maximum magnitude, then rejects a normalized determinant of magnitude <= 1e-12. This supports uniformly tiny/large scales but blocks poorly conditioned matrices. Unrepresentable inverse results return null. `worldToLocal` and `reparentPreserveWorld` throw a coded error rather than approximating. For filtered inheritance, point conversion callers use `inheritanceFrame` as their parent frame.

Reparenting computes inverse(filtered new parent) × old world. Authoring decomposition preserves the requested rotation, takes positive X magnitude, uses negative Y scale for reflection, and stores remaining independent axis angles in shear. Zero-length axes get zero shear. Runtime evaluation never decomposes matrices. This function computes new local data; applying an editor mutation through commands remains future work.

`compileTransformHierarchy` accepts authored bones, produces stable breadth-first parent-before-child order, dense indices and both ID mappings, and copies setup transforms. `evaluateTransformHierarchy` evaluates a complete setup pose in O(B). These are transform-only helpers, not the full P1 runtime or animation buffers. Allocation/dirty-subtree optimization is deferred until profiling.

Tests `xf_001`–`xf_014` cover numeric canonical cases, including a 10,000-bone reversed input chain, reflection, independent shear axes and mixed inheritance. Algebra tests add deterministic inverse/point round-trips and all five reparent modes. No new dependencies. Source-specific compatibility goldens and P0 gaps remain open.
