# 43 — AI Agent Work Breakdown

This file converts the specification into implementation-sized work packages.

---

## EPIC A — Repository foundation

### A01
Create pnpm workspace and package boundaries.

Acceptance:
- typecheck all empty packages
- no circular deps
- path aliases documented

### A02
Set lint/test/build conventions.

### A03
Create diagnostics package.

### A04
Create canonical math primitives.

---

## EPIC B — Canonical model

### B01
Implement IDs and core skeleton types.

### B02
Implement Zod/runtime validation.

### B03
Implement canonical invariants.

### B04
Implement model migration framework.

---

## EPIC C — Transform runtime

### C01
Mat2D operations.

### C02
Local transform -> matrix.

### C03
Normal inheritance.

### C04-C07
One inheritance mode per task.

### C08
Runtime compile topological sort.

### C09
Transform golden tests.

Do not combine C03-C07 into one AI task.

---

## EPIC D — Animation

### D01
Compiled scalar timeline.

### D02
Binary-search/cursor sampling.

### D03
Linear/stepped curves.

### D04
Bezier evaluator.

### D05
Rotation semantic interpolation.

### D06
Animation track state.

### D07
Mixing.

### D08
Event interval traversal.

---

## EPIC E — Spine 3.8

### E01
Version detector.

### E02
3.8 source AST/schema.

### E03
bone normalization.

### E04
slot normalization.

### E05
skin/region.

### E06
unweighted mesh.

### E07
weighted packed vertices.

### E08
linked mesh resolution.

### E09
deform.

### E10
animations.

### E11
IK source normalization.

### E12
3.8.75 profile.

### E13
repair framework.

Each task includes fixture.

---

## EPIC F — DragonBones

Mirror feature-sized tasks:
- version/schema
- bones
- slots
- skins
- mesh
- weights
- FFD
- IK
- events

---

## EPIC G — Renderer

### G01
Pixi renderer facade.

### G02
regions.

### G03
CPU-skinned meshes.

### G04
slot draw order.

### G05
color/blend.

### G06
clipping.

### G07
debug bone overlay.

---

## EPIC H — Constraints

### H01
constraint interface/order.

### H02
one-bone IK.

### H03
two-bone IK.

### H04
reflection/non-uniform scale cases.

### H05-H08
transform constraint strategies.

### H09
path geometry compiler.

### H10
arc-length sampler.

### H11-H13
path constraint modes.

---

## EPIC I — Editor shell

### I01
React/Vite app.

### I02
Tauri app shell.

### I03
FlexLayout panels.

### I04
project repository abstraction.

### I05
open/save native.

### I06
autosave.

---

## EPIC J — Commands

### J01
command bus.

### J02
history transaction.

### J03
bone commands.

### J04
slot/attachment commands.

### J05
animation key commands.

### J06
mesh commands.

### J07
weight stroke command.

---

## EPIC K — Stage tools

### K01
viewport adapter.

### K02
selection.

### K03
transform gizmo.

### K04
bone creation state machine.

### K05
marquee.

### K06
lasso.

---

## EPIC L — Mesh/weights

### L01
mesh topology model.

### L02
earcut adapter.

### L03
adjacency.

### L04
vertex/edge/face picking.

### L05
weight heatmap.

### L06
weight brush.

### L07
smoothing.

### L08
auto weights V1.

---

## EPIC M — Timeline/graph

### M01
timeline view model.

### M02
key selection.

### M03
move/scale keys.

### M04
playhead/scrub.

### M05
curve graph view.

### M06
Bezier handles.

---

## EPIC N — Export

### N01
capability scanner.

### N02
export planner.

### N03
Spine 3.8 target AST.

### N04
Spine 3.8 serializer.

### N05
DragonBones target AST/serializer.

### N06
round-trip tests.

---

## EPIC O — Spine 4.2 / Physics

Only after 3.8/DB core is stable.

### O01
4.2 version/schema.

### O02
4.2 deltas vs 3.8.

### O03
physics canonical mapping.

### O04
clean-room physics solver.

### O05
bake.

### O06
downgrade to 3.8.

---

## Agent task rules

Each task:
- one primary responsibility;
- preferably <= ~500 net LOC unless generated schemas;
- at least one new test;
- no unrelated refactor;
- no new dependency without declaration;
- must reference relevant doc number.

Parallelization:
- independent adapter features can run in parallel after canonical interfaces lock;
- transform/runtime semantics should not be parallel-edited by multiple agents without ownership boundaries.
