# 39 — Implementation Spec: Secondary Physics and Baking

This is a clean-room native solver specification. It is not a transcription of Spine runtime code.

---

## 1. Design goals

- deterministic fixed-step simulation;
- suitable for secondary bone motion;
- scrub/reset/prewarm support;
- animation-driven parameters;
- bake-to-keyframes;
- canonical parameters broad enough to map supported external physics data.

---

## 2. Runtime state

Separate authored config from transient state.

```ts
interface PhysicsConstraintConfig {
  boneIndex: number;
  inertia: number;
  strength: number;
  damping: number;
  massInverse: number;
  wind: number;
  gravity: number;
  mix: number;
}

interface PhysicsConstraintState {
  offsetX: number;
  offsetY: number;
  offsetRotation: number;

  velX: number;
  velY: number;
  velRotation: number;

  prevTargetX: number;
  prevTargetY: number;
  prevTargetRotation: number;

  initialized: boolean;
}
```

Exact canonical parameter meanings must be documented separately from any source adapter.

---

## 3. Target pose

Physics does not replace animation sampling.

Pipeline:

```text
animation pose
 -> constraints before physics
 -> physics target pose
 -> secondary simulation
 -> mixed final pose
```

The target is the non-physics pose for the affected bone/property.

---

## 4. Spring model

Conceptual scalar equation:

```text
a =
  strength * (target - x)
  + externalForce * massInverse
```

Velocity damping:

```text
v = v * dampingFactor
```

Semi-implicit Euler:

```text
v += a * dt
x += v * dt
```

For rotation use angular difference with semantic wrapping.

---

## 5. Inertia

Inertia may be represented as response to target acceleration/velocity changes.

Recommended canonical clean-room interpretation:
- compute target delta since previous simulation step;
- convert a configurable fraction into secondary offset impulse;
- spring then pulls offset back toward zero.

Example conceptual approach:

```text
targetVelocity = (target - prevTarget) / dt
inertialImpulse = -(targetVelocity - prevTargetVelocity) * inertia
```

If canonical model adopts this, document it explicitly.

For source compatibility, source adapters may map their parameter set approximately or exactly only when verified by independent tests.

Do not label behavior “exact Spine 4.2 physics” until fixtures prove it.

---

## 6. Gravity and wind

Represent external acceleration in world or constraint-defined space.

Example:

```text
forceX = windX
forceY = gravityY + windY
```

If source format defines directional/scalar semantics differently, adapter converts into canonical vector/parameter form.

---

## 7. Fixed timestep

Recommended default:
```text
fixedDt = 1/60
```

Runtime:

```ts
accumulator = min(accumulator + realDt, maxAccumulated);

while (accumulator >= fixedDt) {
  stepPhysics(fixedDt);
  accumulator -= fixedDt;
}
```

Suggested `maxAccumulated`: small bounded value such as 0.25 s, configurable.

On browser tab resume:
- avoid simulating minutes of backlog.

---

## 8. Initialization

On first evaluation or reset:
- set simulated state to current target;
- velocities = 0;
- previous target = current target.

Never start from origin unless explicitly requested.

---

## 9. Reset conditions

Reset when:
- animation seek is discontinuous beyond threshold;
- skeleton setup pose reset;
- skin/rig change invalidates bone;
- user presses Reset Physics;
- constraint becomes newly active if semantics require.

---

## 10. Scrubbing

Random seek cannot rely on prior wall-clock simulation.

Modes:

### Fast preview
Reset at seek position; no history.

### Accurate preview
Simulate from nearest cached checkpoint / animation start.

### Bake
Always deterministic accurate simulation.

---

## 11. Prewarm

Some secondary motion may need settling.

Bake settings:
- prewarm duration
- fixed step
- start animation state

Prewarm does not emit authored events unless explicitly requested.

---

## 12. Physics mixing

Final:
```text
final = blend(targetPose, simulatedPose, mix)
```

Rotation uses angle-aware blend.

Mix = 0 must be exact no-op.

---

## 13. Baking algorithm

Inputs:
- animation
- physics settings
- sample FPS
- range
- prewarm
- simplification tolerance

Pseudo:

```ts
resetSkeletonAndPhysics();
prewarm();

for frame in range:
  t = frame / fps;
  evaluateAnimationAt(t);
  simulateTo(t);
  recordAffectedBoneTransforms();
```

Then key reduction.

---

## 14. Baked key reduction

Scalar:
- recursively remove middle sample if interpolation from endpoints stays within error.

Transform:
- test world-space endpoints or a representative point at bone tip.

Rotation:
- angular error.

Recommended:
- preserve first/last
- preserve discontinuities
- preserve event boundaries if relevant

---

## 15. Determinism test

Run identical bake:
- twice
- with different real rendering frame rates
- with editor UI active/inactive

Output key samples before reduction must match within epsilon.

---

## 16. Stability limits

Guard:
- huge dt
- huge parameter values
- NaN target
- negative invalid mass terms
- damping outside canonical range

Canonical validator either clamps explicitly or rejects based on defined policy.

---

## 17. Performance

Physics constraint count is usually modest.
Prefer clarity first.

If hundreds/thousands:
- dense arrays
- batch solve
- worker only for baking, not live frame interaction unless needed.

---

## 18. Compatibility claims

Use labels:
- `mapped`
- `approximated`
- `baked`
- `unsupported`

Do not claim exact compatibility merely because equivalent parameter names exist.

---

## 19. Tests

`phys_001_rest`
`phys_002_step_response`
`phys_003_damping`
`phys_004_gravity`
`phys_005_wind`
`phys_006_mix_zero`
`phys_007_mix_one`
`phys_008_reset`
`phys_009_seek`
`phys_010_fixed_step_frame_rate_independence`
`phys_011_bake`
`phys_012_key_reduction`
`phys_013_rotation_wrap`
