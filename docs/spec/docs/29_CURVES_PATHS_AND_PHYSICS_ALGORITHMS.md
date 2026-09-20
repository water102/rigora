# 29 — Curves, Paths, Animation Sampling and Physics

# Part A — Timeline key lookup

Keys are sorted by time.

Evaluation:
- if playback advances monotonically, keep cached cursor;
- otherwise binary search;
- handle exact-key boundaries deterministically.

For N keys:
- random seek: O(log N)
- sequential playback: amortized O(1)

---

# Part B — Cubic Bezier easing

Animation easing commonly maps normalized time `x` to normalized value `y`.

Cubic Bezier:

```text
B(t) = (1-t)^3 P0
     + 3(1-t)^2 t P1
     + 3(1-t)t^2 P2
     + t^3 P3
```

with standard easing endpoints:
- `P0=(0,0)`
- `P3=(1,1)`

To evaluate value at time x, solve `Bx(t)=x`, then use `By(t)`.

Recommended:
1. small LUT for initial bracket;
2. Newton-Raphson when derivative is safe;
3. bisection fallback.

`bezier-js` can provide generic curve math; runtime may later use a specialized fast easing evaluator.

Never assume curve parameter `t == x`.

---

# Part C — Stepped interpolation

For stepped keys:
- hold previous value until next key time.
- define exact boundary behavior consistently and test it.

---

# Part D — Arc-length parameterization

Path constraints need “distance along curve”, not raw Bezier t.

Precompute per segment:
- sample t values;
- cumulative lengths.

Query distance `s`:
1. find LUT interval via binary search;
2. estimate t;
3. optionally refine by local Newton/bisection;
4. evaluate point and tangent.

Adaptive subdivision is preferable when curve curvature varies heavily.

---

# Part E — Tangent and orientation

For cubic Bezier derivative:

```text
B'(t)
```

Path tangent angle:

```text
atan2(dy, dx)
```

Guard near-zero derivative with neighboring sample fallback.

---

# Part F — Constant-speed vs parameter-speed

Do not conflate:
- uniform t;
- uniform arc length.

Source formats may expose “constant speed” behavior. Preserve this as an explicit semantic property.

---

# Part G — Animation mixing

For scalar channels:
```text
result = base + mix * (target - base)
```

Transforms require semantic-aware mixing:
- rotation wrap/spin;
- scale reflection;
- shear;
- additive vs replace modes.

Recommended architecture:
`ChannelMixerStrategy`.

Animation tracks should not mutate canonical keyframe arrays.

---

# Part H — Event sampling

When advancing from previous time to current time:
- emit events crossed by interval;
- handle loop wrap;
- avoid double emission at exact boundaries;
- support reverse playback only if explicitly designed.

Events must use timeline interval logic, not “current frame equality”.

---

# Part I — Secondary physics model

Use a clean-room, fixed-step secondary-motion solver.

Candidate V1 model:
- inertial offset state;
- spring toward authored target;
- damping;
- gravity;
- wind;
- strength/mix.

A common damped spring conceptual form:

```text
x'' + c*x' + k*(x-target) = external
```

Do not integrate naïvely with variable frame delta.

---

# Part J — Integrator choice

Recommended starting point:
**semi-implicit Euler** for simplicity and better stability than explicit Euler.

Per fixed step:
```text
v += acceleration * dt
v *= dampingFactor
x += v * dt
```

Alternative:
- Verlet-like positional integration for chain secondary motion.

Do not add RK4 unless tests show it is necessary.

---

# Part K — Fixed timestep

Runtime:
```text
accumulator += frameDt
while accumulator >= fixedDt:
  simulate(fixedDt)
  accumulator -= fixedDt
```

Clamp accumulated catch-up to avoid spiral-of-death after tab suspension.

Editor scrubbing:
- reset state;
- simulate from deterministic checkpoint or beginning;
- use prewarming/caching for long animations.

---

# Part L — Physics baking

To export physics to a target without physics support:

1. choose sampling FPS;
2. reset deterministic state;
3. prewarm if semantics require;
4. simulate;
5. record resulting bone channels;
6. simplify generated keys under error threshold;
7. export ordinary animation.

Key simplification can use curve-fit/error-driven removal rather than keeping every simulation frame.

---

# Part M — Key reduction

For baked scalar/angle tracks:
- start with all samples;
- recursively remove points whose interpolation error is below tolerance;
- rotation error measured angularly;
- transform error can be measured in resulting world-space points for higher quality.

This is analogous to RDP but applied to time/value curves.

---

# Part N — Onion skin

No special skeletal algorithm:
- evaluate pose at neighboring times;
- render to separate layers/render textures;
- tint/alpha according to temporal distance.

Cache nearby poses while scrub direction remains local.

---

# Part O — Tests

Curves:
- x inversion near flat derivative;
- exact 0/1 endpoints;
- pathological handles;
- stepped boundary.

Path:
- straight line;
- high-curvature cubic;
- closed path wrap;
- zero-length segment.

Physics:
- deterministic replay;
- frame-rate independence under fixed step;
- rest convergence;
- extreme damping;
- resume after large frame gap.
