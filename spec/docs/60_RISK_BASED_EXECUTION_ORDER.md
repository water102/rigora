# 60 — Risk-Based Execution Order

## Highest-risk semantics
1. transform inheritance;
2. reflection/negative scale;
3. weighted mesh + deform;
4. constraint order;
5. Spine 3.8.75 special cases;
6. path constraints;
7. export-loss detection;
8. 4.2 physics mapping.

## Burn-down sequence
First prove:
- transform
- animation
- 3.8 parsing

Then:
- mesh
- weights
- deform

Then:
- constraints

Then invest deeply in:
- editor UX
- exporters
- 4.2 physics.

## Why
A polished editor on incorrect transform/deform semantics creates rework in:
- gizmos
- timeline
- saved projects
- exporter
- runtime
- fixtures.

## Spike tasks
Use explicit research spikes when behavior is uncertain:
- `SPIKE-SP38-3875-IK`
- `SPIKE-PATH-CONSTANT-SPEED`
- `SPIKE-DB-ROTATED-ATLAS`
- `SPIKE-SP42-PHYSICS-MAPPING`

Spike output:
- finding;
- minimized fixture;
- proposed contract;
- ADR if needed;
- no production implementation required.
