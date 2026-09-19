# 21 — AI Agent Implementation Guide

## 1. Agent must read before coding

1. Architecture
2. Canonical Data Model
3. Transform Semantics
4. relevant compatibility doc
5. Test Strategy
6. ADRs

## 2. Task contract

Every coding task must specify:
- package
- public interfaces
- fixture IDs
- acceptance tests
- forbidden dependencies
- diagnostics
- performance considerations

## 3. Agent rules

- Do not add dependencies without updating dependency manifest.
- Do not make external format fields part of canonical model unless semantic.
- Do not bypass command bus for editor mutations.
- Do not change transform conventions.
- Do not copy Spine runtime implementation.
- Do not “fix” fixtures to make tests pass without review.
- Do not suppress diagnostics.
- Avoid `any`.
- Preserve deterministic output.

## 4. Required PR output

Agent reports:
- files changed
- design decisions
- tests added
- fixtures affected
- compatibility impact
- performance impact
- new dependencies
- unresolved risks

## 5. Task sizing

Prefer tasks that can be validated independently:
- version detector
- curve evaluator
- single timeline type
- single fixture
- single command

Avoid “implement whole Spine importer” as one task.

## 6. Red flags

Stop and request architectural review if:
- canonical model needs Spine version-specific field;
- constraint ordering becomes conditional in renderer;
- import parser constructs Pixi objects;
- editor directly modifies runtime buffers;
- exporter silently drops data;
- official Spine source is proposed as implementation reference.


## 7. Implementation-level specs

Before implementing the following systems, read the matching document:

- transforms/inheritance -> `35_IMPLEMENTATION_TRANSFORM_PIPELINE.md`
- Spine 3.8/3.8.75 -> `36_IMPLEMENTATION_SPINE_38_3875.md`
- weighted mesh/deform -> `37_IMPLEMENTATION_WEIGHTED_MESH_DEFORM.md`
- path constraints -> `38_IMPLEMENTATION_PATH_CONSTRAINT.md`
- physics/baking -> `39_IMPLEMENTATION_PHYSICS.md`
- generic import/export -> `40_IMPLEMENTATION_IMPORT_EXPORT_ENGINE.md`
- runtime ordering -> `41_IMPLEMENTATION_RUNTIME_EVALUATION_ORDER.md`
- compatibility debugging -> `42_IMPLEMENTATION_TEST_ORACLES_AND_DIFFING.md`
- task decomposition -> `43_IMPLEMENTATION_AGENT_WORK_BREAKDOWN.md`

These documents take precedence over generic implementation guesses.

## 8. Full execution plan

Before starting a task:
1. read `44_MASTER_EXECUTION_PLAN.md`;
2. read the active phase plan (`45`–`54`);
3. check `55_DEPENDENCY_GRAPH.md`;
4. if multiple agents are active, follow `56_PARALLEL_AGENT_STRATEGY.md`;
5. confirm the task is Ready;
6. use the phase exit gate before marking phase complete.

Use `63_IMPLEMENTATION_START_SEQUENCE.md` for the initial implementation order.
