# 53 — Phase 8: Spine 4.2 and Physics

## Goal
Layer Spine 4.2 on top of a stable 3.8/DragonBones foundation and add native clean-room secondary physics plus downgrade/baking.

## Entry
P7 green.

## A — 4.2 delta inventory
Create table of differences from 3.8:
- syntax-only;
- changed semantics;
- new attachment/property;
- new constraint;
- new timeline;
- texture/atlas change.

Do not clone 3.8 parser and patch blindly.

## B — 4.2 parser
Separate AST/schema:
- bones
- slots
- skins
- meshes
- deform
- constraints
- animation
- events
- texture metadata.

Reuse only version-neutral utilities.

## C — Canonical mapping
Each 4.2 delta either:
- maps to existing canonical semantics;
- requires an ADR-backed canonical extension;
- remains preserved unsupported metadata.

## D — Physics source mapping
For each source field classify:
- exact mapping;
- approximated mapping;
- preserved/unsupported.

Do not claim exact behavior without independent compatibility fixtures.

## E — Physics solver
Implement doc 39:
- independent runtime state;
- fixed timestep;
- spring;
- damping;
- inertia;
- gravity;
- wind;
- mix;
- deterministic reset.

## F — Physics editor
- parameter inspector;
- enable/disable;
- reset;
- live preview;
- accurate seek option;
- visual debugging.

## G — Physics animation
Support animatable parameters included by canonical model.

## H — Bake
- prewarm;
- deterministic simulation;
- sample FPS;
- capture bone transforms;
- curve/key reduction;
- temporary export projection by default.

## I — 4.2 exporter subset
Explicit capability matrix.
No implied “all Spine 4.2 features”.

## J — Downgrade to 3.8
For physics:
- bake;
- remove;
- block.

For other 4.2-only features:
- deterministic convert if available;
- otherwise report/block.

## K — Regression
Every 4.2 merge runs full Spine 3.8.75 and DragonBones suites.

## Exit gate
- [x] version routing isolated
- [x] mandatory 4.2 import subset green
- [x] delta matrix complete for supported scope
- [x] physics fixed-step deterministic
- [x] reset/seek tests green
- [x] bake deterministic
- [x] downgrade reports correct
- [x] 3.8/DB regressions unchanged
- [x] exact vs approximate support labels documented
