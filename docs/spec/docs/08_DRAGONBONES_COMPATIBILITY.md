# 08 — DragonBones Compatibility

## 1. Baseline

DragonBones publishes:
- MIT-licensed JS/TS runtime;
- a documented 5.5 JSON format;
- MIT-licensed conversion tools that historically support Spine <-> DragonBones conversion.

The runtime is useful as reference and potentially reusable permissive code, subject to attribution and architecture boundaries.

## 2. Adapter

```text
format-dragonbones/
  schema-55.ts
  parser.ts
  normalizer.ts
  exporter.ts
  capability.ts
  diagnostics.ts
```

## 3. Key fields to map

### Global
- version
- compatibleVersion
- frameRate
- armature list

### Armature
- bone
- slot
- skin/display
- IK
- animation
- FFD
- actions/events
- nested armatures

### Transform
DragonBones uses transform components such as:
- x/y
- skX/skY
- scX/scY

These require semantic conversion, not field renaming.

### Mesh
Map:
- vertices
- uvs
- triangles
- weights
- slotPose
- bonePose
- shared mesh metadata
- inheritDeform

## 4. Runtime reuse policy

Allowed approach:
- fork or extract MIT DragonBones algorithms where useful;
- preserve MIT notice;
- wrap behind HNN interfaces;
- write regression tests before refactoring.

Preferred long-term:
- canonical model is HNN;
- DragonBones runtime code is not the architecture root.

## 5. DragonBones Tools

The public DragonBones Tools repository demonstrates:
- Spine -> DragonBones conversion
- DragonBones -> Spine conversion
- JSON -> binary conversion

Do not assume its converters are fully correct. Its issue tracker contains historical conversion issues, including deform and texture rotation problems. Therefore it is a reference/test oracle candidate, not a sole ground truth.

## 6. Golden tests

Mandatory:
- DB setup pose
- IK
- weighted mesh
- shared mesh
- FFD
- rotated texture atlas
- frame events
- nested armature
- color transform including offsets
