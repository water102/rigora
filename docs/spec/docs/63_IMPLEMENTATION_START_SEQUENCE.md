# 63 — Concrete Implementation Start Sequence

This is the recommended order for the first coding cycle.

## Batch 1 — Repository and diagnostics
1. `P0-A01` pnpm workspace
2. TypeScript shared config
3. Vitest baseline
4. diagnostics package
5. math package shell

## Batch 2 — Canonical model
6. core types
7. runtime validation
8. referential/invariant validator
9. source provenance
10. native snapshot serializer for tests

## Batch 3 — Transform
11. Mat2D operations
12. local transform → matrix
13. normal inheritance
14. reflection fixtures
15. remaining mandatory inheritance strategies
16. world/local conversion
17. reparent preserve-world test

## Batch 4 — Animation
18. compiled timeline
19. binary search/cursor
20. linear
21. stepped
22. cubic Bezier
23. rotation interpolation
24. loop/seek
25. event crossing

## Batch 5 — Source adapters
26. Spine version detector
27. Spine 3.8 bone/slot/region
28. exact 3.8.75 profile warning
29. DragonBones bone/slot/region

## Batch 6 — Renderer
30. Pixi facade
31. atlas region mapping
32. slot sprite
33. draw order
34. debug skeleton overlay

## Architectural proof gate
Demonstrate:
- one Spine 3.8.75 fixture;
- one DragonBones fixture;
- both normalize into HNN canonical model;
- both use the same runtime;
- both render through the same Pixi adapter;
- numeric transform samples pass.

Only then proceed to P2 mesh/runtime as the main critical path.

## Batch 7 — Mesh
Follow P2:
- unweighted mesh
- weighted mesh
- linked mesh
- deform
- skins
- clipping.

## Batch 8 — Constraints
Follow P3.

## UI note
A separate UI agent may scaffold P4 after F1, but UI must not define domain semantics.
