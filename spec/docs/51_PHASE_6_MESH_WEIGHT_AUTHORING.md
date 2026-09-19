# 51 — Phase 6: Mesh, Rigging and Weight Authoring

## Goal
Allow creation of new rigs/meshes instead of only editing imported assets.

## Entry
P2 runtime + P4 editor foundation green.

## A — Attachment creation
Create:
- region
- mesh
- clipping
- path
- bounding box
from library assets/slots.

## B — Mesh topology
Modes:
- vertex
- edge
- face
- boundary.

Commands:
- add/move/delete vertex;
- add/remove edge;
- retriangulate;
- reset topology.

Maintain stable vertex IDs and adjacency.

## C — Auto mesh
Worker pipeline:
```text
alpha mask
 -> marching squares
 -> contour cleanup
 -> RDP simplify
 -> padding
 -> triangulation
```
UI:
- threshold
- simplification
- padding
- density
- preview/apply/cancel.

## D — Binding
- bind selected bones
- unbind
- influence list
- lock
- maximum influences.

## E — Weight paint
Brush:
- add
- subtract
- replace
- erase
- smooth

Controls:
- radius
- strength
- falloff
- bone
- locked influences.

Use sparse before/after deltas.

## F — Heatmap
Display active bone contribution and optional overview mode.

## G — Auto weights V1
Inverse distance to bone segments:
- candidate set
- top-N
- configurable exponent
- normalize
- preview.

Advanced diffusion/harmonic weighting is deferred.

## H — Weight smooth
Graph-neighbor Laplacian style smoothing.
Simultaneous update, not in-place traversal.

## I — Selection
- marquee
- lasso
- connected
- invert
- vertex/edge/face priority.

RBush for coarse query; exact geometry test afterward.

## J — Deform authoring
- setup vs animation mode separation;
- key mesh deformation;
- zero/reset deform;
- linked-mesh inherit-deform behavior.

## K — Path editor
- control points;
- open/closed;
- tangent preview;
- path constraint preview.

## Exit gate
- [ ] create mesh from image
- [ ] manual topology editing robust
- [ ] auto mesh produces valid polygon/triangles
- [ ] binding works
- [ ] weight brush works
- [ ] smoothing deterministic
- [ ] auto weight V1 works
- [ ] undo memory uses sparse deltas
- [ ] deform authoring works
- [ ] path editing works
- [ ] topology undo/redo stress does not corrupt mesh
- [ ] large-mesh interaction benchmark recorded
