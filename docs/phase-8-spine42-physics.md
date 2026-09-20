# Phase 8 support matrix

This document records the deliberately supported Spine 4.2 subset and the
clean-room physics behavior implemented by Rigora. It is a capability contract,
not a claim of full Spine 4.2 runtime equivalence.

| Area                                 | Status                | Mapping / fallback                                                     |
| ------------------------------------ | --------------------- | ---------------------------------------------------------------------- |
| Version routing                      | supported             | `@rigora/format-spine-42` is a separate adapter                        |
| Bones, slots, skins, regions, meshes | supported subset      | normalized through version-neutral canonical fields                    |
| Core animations                      | supported subset      | accepted where the canonical timeline model represents them            |
| Physics source fields                | approximated          | canonical gravity, wind, damping, strength, mass inverse and mix       |
| Physics runtime                      | supported             | deterministic fixed-step clean-room `PhysicsWorld`                     |
| Physics seek/reset                   | supported             | reset and deterministic resimulation via `seek`                        |
| Physics bake                         | supported             | prewarm, fixed sample rate, deterministic capture, tolerance reduction |
| Native Spine 4.2 physics export      | unsupported           | use bake or remove action; no exactness claim                          |
| 4.2-only fields outside the subset   | preserved/unsupported | adapter emits explicit subset warning                                  |

## Physics semantics

The runtime uses semi-implicit Euler integration. `mix = 0` is a no-op, damping
is clamped at zero, and negative mass inverse is clamped at zero. The bake API
always starts from a reset world, applies prewarm in fixed steps, and captures
the same samples independent of render-frame cadence. Key reduction preserves
the first and last samples and recursively retains samples exceeding the
configured positional tolerance.

## Downgrade policy

When targeting Spine 3.8, physics is not emitted as native data. Callers must
choose one of the existing planner actions: `bake`, `drop`, or `block`. The
adapter and runtime label this behavior as `approximated`/`baked`, never
`exact`.
