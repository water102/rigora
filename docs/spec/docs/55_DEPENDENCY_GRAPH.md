# 55 — Dependency and Sequencing Graph

## Package DAG

```text
math
 |
 v
model <----------- diagnostics
 |
 +-----------> animation
 |               |
 |               v
 |           constraints
 |               |
 +---------------+----> runtime
                       /     \
                      v       v
              renderer-pixi  worker-api

editor-commands ---> editor-state
       |                 |
       +-------+---------+
               |
      stage / timeline / mesh / weights
               |
               v
             apps
```

Format packages:
```text
format-spine-common -> model + diagnostics + math helpers
format-spine-38 ----> format-spine-common
format-spine-42 ----> format-spine-common
format-dragonbones -> model + diagnostics + math helpers
```
`format-spine-38` and `format-spine-42` must not depend on one another.

## Semantic dependency DAG

```text
Transform
 +-> Animation
 +-> Mesh Skinning
 +-> IK
 +-> Path Geometry
      +-> Path Constraint

Mesh
 +-> Weights
 +-> Deform
 +-> Mesh Editor
      +-> Weight Editor

Command Bus
 +-> Hierarchy
 +-> Inspector
 +-> Timeline
 +-> Mesh Editor
 +-> AI Commands
```

## Blocking contracts
Canonical model blocks nearly everything.
Transform blocks runtime, IK, weighted mesh and compatibility pose diff.
Animation-channel contract blocks timeline/graph/deform/constraint animation.
Command bus blocks persistent editor tools and AI authoring.

## Safe parallelism
After interfaces freeze:
- Spine parser || DragonBones parser || renderer;
- editor shell || runtime mesh || fixture preparation;
- timeline UI || mesh editor UI.

## Unsafe parallelism
Do not split ownership casually for:
- canonical transform semantics;
- constraint evaluation order;
- deform semantics;
- native migration;
- capability scanning.
