# HNN Bones — Technical Specification Pack

**Purpose:** complete engineering specification for implementing a modern 2D skeletal animation editor/runtime inspired by the capabilities of Spine/LoongBones, built from a clean-room canonical model and reusing permissively licensed libraries where practical.

**Mandatory compatibility targets**
- Spine **3.8.x**, with **3.8.75 as an explicit golden/repair target**
- Spine **4.2.x**
- DragonBones JSON **5.5-compatible family**
- Native HNN project format
- PixiJS 8 runtime/editor renderer

**Primary implementation stack**
- TypeScript
- React + Vite
- PixiJS 8
- Zustand
- Tauri 2 for desktop
- pnpm workspace
- Vitest + Playwright
- Web Workers/Comlink for heavy tasks
- Rust/WASM only after profiling

This package is intended to be handed directly to an AI coding agent or engineering team.

## Reading order

1. `docs/01_PRODUCT_SCOPE.md`
2. `docs/02_ARCHITECTURE.md`
3. `docs/03_CANONICAL_DATA_MODEL.md`
4. `docs/04_TRANSFORM_SEMANTICS.md`
5. `docs/05_FEATURE_MATRIX.md`
6. `docs/06_SPINE_38_COMPATIBILITY.md`
7. `docs/07_SPINE_42_COMPATIBILITY.md`
8. `docs/08_DRAGONBONES_COMPATIBILITY.md`
9. `docs/09_IMPORT_EXPORT_PIPELINE.md`
10. `docs/10_RUNTIME_ARCHITECTURE.md`
11. `docs/11_EDITOR_ARCHITECTURE.md`
12. `docs/12_COMMAND_UNDO_AI_ARCHITECTURE.md`
13. `docs/13_DEPENDENCIES.md`
14. `docs/14_LICENSE_AND_CLEANROOM.md`
15. `docs/15_TEST_STRATEGY.md`
16. `docs/16_FIXTURE_CATALOG.md`
17. `docs/17_PERFORMANCE_BUDGETS.md`
18. `docs/18_NATIVE_FILE_FORMAT.md`
19. `docs/19_DIAGNOSTICS.md`
20. `docs/20_ROADMAP.md`
21. `docs/21_AI_AGENT_IMPLEMENTATION_GUIDE.md`
22. `docs/22_DEFINITION_OF_DONE.md`
23. `docs/23_RISK_REGISTER.md`
24. `docs/24_OPEN_QUESTIONS.md`
25. `docs/25_ALGORITHM_CATALOG.md`
26. `docs/26_SKELETAL_MATH_AND_SKINNING.md`
27. `docs/27_IK_AND_CONSTRAINT_SOLVERS.md`
28. `docs/28_MESH_GEOMETRY_AND_WEIGHT_ALGORITHMS.md`
29. `docs/29_CURVES_PATHS_AND_PHYSICS_ALGORITHMS.md`
30. `docs/30_DESIGN_PATTERNS.md`
31. `docs/31_DATA_STRUCTURES_AND_PERFORMANCE_PATTERNS.md`
32. `docs/32_EDITOR_INTERACTION_ALGORITHMS.md`
33. `docs/33_ALGORITHM_SELECTION_BY_FEATURE.md`
34. `docs/34_NUMERICAL_ROBUSTNESS_AND_GEOMETRY_RULES.md`
35. `docs/35_IMPLEMENTATION_TRANSFORM_PIPELINE.md`
36. `docs/36_IMPLEMENTATION_SPINE_38_3875.md`
37. `docs/37_IMPLEMENTATION_WEIGHTED_MESH_DEFORM.md`
38. `docs/38_IMPLEMENTATION_PATH_CONSTRAINT.md`
39. `docs/39_IMPLEMENTATION_PHYSICS.md`
40. `docs/40_IMPLEMENTATION_IMPORT_EXPORT_ENGINE.md`
41. `docs/41_IMPLEMENTATION_RUNTIME_EVALUATION_ORDER.md`
42. `docs/42_IMPLEMENTATION_TEST_ORACLES_AND_DIFFING.md`
43. `docs/43_IMPLEMENTATION_AGENT_WORK_BREAKDOWN.md`

## Core design rule

> Import/export formats are adapters. The editor and runtime operate only on the canonical HNN model.

Never make Spine JSON, DragonBones JSON, Pixi classes, React state, or Tauri APIs the canonical source of truth.

## Source baseline

The official Spine JSON documentation describes exported skeleton data as stateless data composed of bones, slots, skins and animations. DragonBones publishes an MIT-licensed TypeScript/JavaScript runtime and a documented 5.5 JSON format. LoongBones documents direct import of Spine 3.8.75 and later release notes mention Spine 4.2 texture/physics import and export fixes.

See `docs/14_LICENSE_AND_CLEANROOM.md` and `SOURCES.md`.

## Implementation-spec layer

Documents 35–43 are intentionally closer to executable design than ordinary architecture documentation. Coding agents should treat them as the default implementation contract unless superseded by an ADR.

The recommended first implementation sequence is:
`35 Transform -> 41 Runtime order -> 36 Spine 3.8 -> 37 Mesh/Deform -> 27 IK -> 38 Path -> 40 Import/Export -> Editor`.


## Full execution-plan documents


44. `docs/44_MASTER_EXECUTION_PLAN.md`
45. `docs/45_PHASE_0_SPEC_AND_CORPUS.md`
46. `docs/46_PHASE_1_RUNTIME_POC.md`
47. `docs/47_PHASE_2_MESH_SKIN_DEFORM.md`
48. `docs/48_PHASE_3_CONSTRAINTS.md`
49. `docs/49_PHASE_4_EDITOR_FOUNDATION.md`
50. `docs/50_PHASE_5_ANIMATION_AUTHORING.md`
51. `docs/51_PHASE_6_MESH_WEIGHT_AUTHORING.md`
52. `docs/52_PHASE_7_EXPORT_COMPATIBILITY.md`
53. `docs/53_PHASE_8_SPINE42_PHYSICS.md`
54. `docs/54_PHASE_9_PRODUCTION_HARDENING.md`
55. `docs/55_DEPENDENCY_GRAPH.md`
56. `docs/56_PARALLEL_AGENT_STRATEGY.md`
57. `docs/57_RELEASE_AND_MILESTONE_GATES.md`
58. `docs/58_PROJECT_CHECKLIST.md`
59. `docs/59_WORK_ITEM_INDEX.md`
60. `docs/60_RISK_BASED_EXECUTION_ORDER.md`
61. `docs/61_PHASE_HANDOFF_TEMPLATE.md`
62. `docs/62_ACCEPTANCE_TEST_MATRIX.md`
63. `docs/63_IMPLEMENTATION_START_SEQUENCE.md`

## Execution-plan usage

Use `44_MASTER_EXECUTION_PLAN.md` as the program plan.
Before a phase, read its dedicated document `45`–`54`.
Use `55` for sequencing, `56` for multi-agent ownership, `57` for milestone gates, `58` for project control, and `63` when starting implementation.
