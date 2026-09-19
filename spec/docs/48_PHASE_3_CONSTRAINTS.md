# 48 — Phase 3: Constraint Runtime

## Goal
Implement deterministic constraint solvers and exact runtime ordering for the supported compatibility surface.

## Entry
P2 green.

## A — Constraint framework
- RuntimeConstraint interface;
- explicit `order`;
- target/affected-bone metadata;
- dependency refresh;
- debug snapshot after each constraint.

## B — One-bone IK
- analytic target angle;
- local/world conversion;
- mix;
- reflection;
- zero-distance guard.

## C — Two-bone IK
- law of cosines;
- bend direction;
- unreachable target;
- non-uniform scale;
- reflection;
- stretch/compress/softness when needed by source semantics.

## D — Transform constraint
Implement separate Strategy modules:
- absolute world
- relative world
- absolute local
- relative local

Mix independently:
- rotate
- translate
- scale
- shear.

## E — Path geometry
- path control-point compile;
- cubic segments;
- arc-length tables;
- distance → t lookup;
- tangent;
- open/closed;
- dynamic weighted/deformed path.

## F — Path constraint
Support canonicalized:
- fixed/percent position;
- fixed/percent/length spacing;
- tangent;
- chain;
- chain-scale.

## G — Ordering/dependency tests
Fixtures must include:
- IK then transform;
- transform then IK;
- prior constraint changing path bones;
- weighted path driven by constrained bones;
- descendants after constrained parent.

## H — Debugging
Compatibility Lab must expose:
- afterAnimation
- afterBaseWorld
- after each constraint
- final pose.

## Exit gate
- [ ] 1-bone IK goldens green
- [ ] 2-bone IK goldens green
- [ ] reflection/nonuniform-scale cases green
- [ ] transform-mode matrix green
- [ ] path sampling goldens green
- [ ] path constraint modes green
- [ ] weighted/deformed path green
- [ ] source order preserved
- [ ] first-divergence diagnostics usable

## Freeze F3
Constraint contract and evaluation order become change-controlled.
