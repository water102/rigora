# 02 — System Architecture

## 1. Architecture principles

1. Canonical model is independent from every external format.
2. Runtime state is separate from authored data.
3. Renderer is an adapter over evaluated pose.
4. Every mutation is a command.
5. Importers normalize; exporters validate capabilities.
6. Unsupported data produces diagnostics, never silent loss.
7. Library-first, but dependencies are wrapped behind interfaces.
8. Expensive work moves to workers only after clear boundaries are defined.
9. Deterministic data structures and test fixtures take priority over UI polish.
10. Cross-version behavior lives in version adapters, not scattered conditionals.

## 2. High-level data flow

```text
Spine 3.8.x ----> Spine38Adapter ----Spine 4.2.x ----> Spine42Adapter -----+--> Canonical HNN Model
DragonBones ----> DragonBonesAdapter -/           |
Native HNN ------------------------------->       |
                                                  v
                                         SkeletonData
                                              |
                                         instantiate
                                              v
                                        SkeletonInstance
                                              |
                                       animation evaluator
                                              v
                                             Pose
                                              |
                                      constraint solving
                                              v
                                       RenderSnapshot
                                              |
                                         Pixi adapter
```

## 3. Monorepo layout

```text
apps/
  editor-web/
  editor-desktop/
  playground/
  compatibility-lab/

packages/
  math/
  model/
  runtime/
  constraints/
  animation/
  renderer-pixi/
  editor-state/
  editor-commands/
  editor-stage/
  editor-timeline/
  editor-graph/
  editor-mesh/
  editor-weights/
  format-native/
  format-spine-common/
  format-spine-38/
  format-spine-42/
  format-dragonbones/
  atlas/
  diagnostics/
  worker-api/
  cli/

tests/
  fixtures/
  golden/
  compatibility/
  performance/
```

## 4. Dependency direction

Allowed:

```text
format-* -> model
runtime -> model + math + constraints + animation
renderer-pixi -> runtime + model
editor-* -> model + commands + runtime
apps -> packages
```

Forbidden:
- `model -> pixi.js`
- `model -> react`
- `model -> tauri`
- `runtime -> editor`
- `format-spine-* -> editor`
- direct cross-imports between version adapters

## 5. State split

### Authored state
Stable serializable project data.

### Runtime state
Current animation time, pose matrices, deform buffers, active skin, mixes.

### Editor state
Selection, tool mode, viewport zoom, expanded tree nodes, temporary drag states.

### Cache state
Triangulations, bounds, texture handles, spatial indexes.

None of these are interchangeable.

## 6. Evaluation pipeline

1. Load setup pose
2. Apply animation timelines
3. Apply animation mixing
4. Resolve local transforms
5. Resolve inheritance
6. Apply IK
7. Apply transform constraints
8. Apply path constraints
9. Apply physics/secondary motion
10. Evaluate deform
11. Build world-space attachment geometry
12. Apply slot draw order/color
13. Submit renderer snapshot

Exact ordering is version/semantics sensitive and must be covered by golden fixtures.

## 7. Extensibility

Every attachment and constraint type SHALL use discriminated unions plus runtime registries where future plugin types are allowed.

No `any` in persisted model schemas.
