# 56 — Multi-Agent Execution Strategy

## Goal
Gain parallel throughput without architectural divergence.

## Ownership examples

### Core owner
`math`, `model`, transform runtime.

### Spine38 owner
`format-spine-38`.

### DragonBones owner
`format-dragonbones`.

### Renderer owner
`renderer-pixi`.

### Editor owner
shell/state/commands.

### Compatibility owner
fixtures, pose diff, regression reports.

## Task packet
Every agent gets:
- Task ID
- Goal
- Owned packages
- Read-only packages
- Required docs
- Input API
- Output API
- Fixture IDs
- Acceptance tests
- Forbidden changes
- Allowed dependencies.

## Interface-first merge
When downstream work depends on an interface:
1. agree interface;
2. merge interface/stub;
3. downstream agents rebase;
4. merge independent implementations.

Do not create competing interfaces on long-lived branches.

## Single-owner high-risk files
- canonical model
- transform semantic contracts
- runtime evaluation order
- native schema
- feature/capability matrix.

## Phase parallelization

P0:
parallel repo/diagnostics/corpus/license; single owner model/transform.

P1:
parallel Spine parser/DB parser/renderer/animation; single owner transform.

P2:
parallel format mappers/renderer/fixtures; single owner deform semantics.

P3:
IK/path geometry/fixtures can parallelize; constraint order central.

P4+:
UI subsystems parallelize heavily once command/model contracts freeze.

## Review agent
Use a separate reviewer for:
- boundary violations;
- missing fixture;
- diagnostic quality;
- license/dependency changes;
- accidental source-format leakage.

## Agent final report
Must include:
- files changed;
- tests added;
- fixtures touched;
- diagnostics added;
- dependency changes;
- compatibility impact;
- performance impact;
- known limitations;
- follow-up work.

## Escalation triggers
Stop implementation and request architectural resolution if:
- canonical schema seems insufficient;
- spec contradiction exists;
- exact 3.8.75 behavior is ambiguous;
- license status is unclear;
- numeric oracle and visual oracle disagree;
- proposed change breaks freeze point.
