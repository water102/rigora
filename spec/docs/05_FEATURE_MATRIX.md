# 05 — Feature / Capability Matrix

Legend:
- **N** native
- **A** adapter mapping
- **B** bake/fallback
- **W** warning/partial
- **X** unsupported for target
- **G** golden-test required

| Feature | Canonical | Spine 3.8 | Spine 4.2 | DragonBones 5.5 | Pixi runtime | V1 |
|---|---|---|---|---|---|---|
| Bone hierarchy | N | A/G | A/G | A/G | N | Yes |
| Translate | N | A/G | A/G | A/G | N | Yes |
| Rotate | N | A/G | A/G | A/G | N | Yes |
| Scale | N | A/G | A/G | A/G | N | Yes |
| Shear/skew | N | A/G | A/G | A/G | N | Yes |
| Negative scale | N | A/G | A/G | A/G | N | Yes |
| Slot | N | A | A | A | N | Yes |
| Draw order | N | A/G | A/G | A/G | N | Yes |
| Region | N | A | A | A | N | Yes |
| Mesh | N | A/G | A/G | A/G | N | Yes |
| Weighted mesh | N | A/G | A/G | A/G | N | Yes |
| Linked/shared mesh | N | A/G | A/G | A/G | N | Yes |
| Deform/FFD | N | A/G | A/G | A/G | N | Yes |
| Skin | N | A/G | A/G | A/G | N | Yes |
| Bounding box | N | A | A | A | optional | Yes |
| Clipping | N | A/G | A/G | A/G | N | Yes |
| Path attachment | N | A/G | A/G | A/G | N | Yes |
| IK | N | A/G | A/G | A/G | N | Yes |
| Transform constraint | N | A/G | A/G | A/W | N | Yes |
| Path constraint | N | A/G | A/G | A/W | N | Yes |
| Physics constraint | N | X/B | A/G | W | N | Later/V1 import |
| Events | N | A/G | A/G | A/G | N | Yes |
| Audio metadata | N | W | A | W | editor | Later |
| Curves | N | A/G | A/G | A/G | N | Yes |
| Two-color tint | N | A/G | A/G | W | N | Yes |
| Nested skeleton | N | W | W | A/G | N | Later |
| Animation mixing | runtime | runtime | runtime | runtime | N | Yes |
| Atlas rotated region | asset | A/G | A/G | A/G | N | Yes |
| Sequence attachments | model | version-dependent | A | version-dependent | N | Later |
| Physics bake to keys | tool | B | B | B | N | Later |

## Required matrix discipline

Every implemented feature gets:
- canonical schema
- importer mapping
- exporter mapping
- runtime implementation
- editor implementation
- diagnostic codes
- fixture IDs
- acceptance criteria

No feature is “done” just because it renders once.
