# 27 — IK and Constraint Solver Algorithms

## 1. Solver philosophy

Use the simplest solver that exactly matches required semantics.

For Spine/DragonBones compatibility, one- and two-bone IK should primarily be analytic rather than replaced by a generic long-chain solver.

FABRIK is reserved for native/extended long-chain IK or future tools.

---

# Part A — One-bone IK

Given:
- bone origin `p`
- target `t`
- parent/world orientation
- bone local axis

Desired world angle:

```text
theta = atan2(t.y - p.y, t.x - p.x)
```

Convert to the bone's local semantic angle and blend by IK mix.

Pitfalls:
- negative parent scale/reflection;
- shear;
- target at same point;
- transform inheritance modes;
- compressed/stretched semantics.

Tests:
- all quadrants;
- mirrored parent;
- mix 0, 0.5, 1;
- zero distance.

---

# Part B — Two-bone analytic IK

Two-link chain lengths:
- `L1`
- `L2`
- target distance `D`

Law of cosines:

```text
cos(angle2) = (D² - L1² - L2²) / (2 L1 L2)
```

Clamp input to `[-1, 1]`.

Elbow direction selects sign of `angle2`.

Parent angle can be solved with:

```text
angle1 = atan2(targetY, targetX)
       - atan2(L2*sin(angle2), L1 + L2*cos(angle2))
```

Actual implementation must account for:
- local/world conversion;
- reflected transforms;
- non-uniform parent scaling;
- stretch/compress flags;
- softness;
- mix.

Do not assume Euclidean lengths remain unchanged under non-uniform parent transforms.

A compatibility implementation may need to solve in a transformed coordinate space.

---

# Part C — Long-chain IK: FABRIK

For a chain of points `p0...pn` and target T:

### Unreachable target
Place all joints on the line toward target while preserving segment lengths.

### Reachable target
Iterate:
1. set end effector to target;
2. backward pass from `n-1 -> 0`, enforcing each segment length;
3. restore root;
4. forward pass from `0 -> n`, enforcing lengths;
5. stop when end error < tolerance or max iterations reached.

Advantages:
- simple;
- fast in practice;
- avoids matrix derivatives/Jacobians;
- supports constraints as projection steps.

Use for:
- native chains > 2 bones;
- editor posing helpers;
- optional procedural tools.

Do NOT substitute FABRIK for source-format two-bone IK unless tests prove semantic equivalence.

---

# Part D — Transform constraint

Treat transform constraint as controlled mixing of target transform properties into constrained bones.

Recommended architecture:

```text
read target world/local transform
 -> derive desired constrained transform
 -> apply mode (absolute/relative, world/local)
 -> mix rotate/translate/scale/shear independently
 -> update dependent world transforms
```

Separate the four semantic modes into Strategy objects rather than one deeply nested function.

---

# Part E — Path constraint

Pipeline:

```text
path control points
 -> path segment representation
 -> arc-length table
 -> requested positions/spacings
 -> point+tangent samples
 -> place/rotate constrained bones
```

Important:
- position mode;
- spacing mode;
- rotate mode;
- constant-speed semantics;
- open/closed path;
- weighted path vertices.

Use `bezier-js` for geometric operations if its semantics fit, but retain our own arc-length/path-placement contract.

---

# Part F — Constraint dependency order

Build ordered constraints from explicit source/canonical order.

Do not solve by repeatedly iterating “until stable” unless a native feature explicitly requires it.

Validate cycles:
- target bone may create dependency cycles;
- path target slot refers to a bone;
- constraints affecting target ancestors can become ambiguous.

If source format allows a configuration, reproduce source ordering; otherwise diagnose.

---

# Part G — Solver stability

Always:
- guard division by near-zero;
- clamp acos input;
- avoid normalizing zero vectors;
- cap iterative solver iterations;
- deterministic stopping threshold.

Suggested FABRIK defaults:
- max iterations: 10–20;
- tolerance relative to character scale.

Centralize scale-aware tolerance.

---

# Part H — Why not CCD/Jacobian by default?

CCD is simple but may converge slowly or produce different poses.
Jacobian methods are flexible but heavier and unnecessary for the primary compatibility cases.

Keep them out of V1 unless a specific native feature requires them.

---

# Part I — Tests

Each solver must test:
- exact reachable target;
- unreachable target;
- target on root;
- degenerate zero-length bone;
- negative scale;
- non-uniform scale;
- mix values;
- animation-driven target;
- hierarchy with upstream constraint.
