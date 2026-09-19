# 41 — Implementation Spec: Runtime Evaluation and Dependency Order

---

## 1. Why this document exists

Most skeletal compatibility bugs are not caused by missing math, but by applying correct operations in the wrong order.

The runtime must have one explicit evaluation pipeline.

---

## 2. Frame update

Recommended high-level flow:

```text
1. advance animation clocks
2. reset required pose channels to setup/base
3. sample active animation tracks
4. mix tracks
5. evaluate base bone world transforms
6. execute ordered constraints
7. execute secondary physics
8. evaluate active attachments/deform
9. skin meshes / evaluate path geometry as required
10. resolve slot colors/attachments/draw order
11. emit crossed events
12. build render snapshot
```

Some source semantics may require path geometry before a path constraint. That is handled inside dependency-aware constraint execution, not by renderer.

---

## 3. Setup pose reset

Do not allocate a fresh pose every frame.

Runtime pose buffers can be reset from compiled setup arrays.

Options:
- copy typed arrays
- overwrite only animated channels using dirty masks

Start correct/simple; optimize after profiling.

---

## 4. Animation track sampling

For each active track:
- calculate local animation time
- loop/clamp
- sample timelines
- write/mix into pose accumulator

Keep event timelines separate from ordinary scalar application because interval crossing matters.

---

## 5. Property ownership

Create compiled property IDs:

```text
bone:12:rotation
slot:3:color
ik:1:mix
```

Track mixing operates on property channels explicitly.

Avoid accidental double application because two imported timelines map to same canonical property.

---

## 6. Constraint compilation

Each runtime constraint knows:
- explicit order
- affected bones
- target dependencies
- whether downstream bone worlds need refresh

Compile constraints sorted stably by:
1. source/canonical order
2. stable tiebreaker

---

## 7. Constraint execution

Pseudo:

```ts
for (const c of constraintsInOrder) {
  ensureDependenciesCurrent(c);

  c.update(ctx);

  markAffectedWorldTransformsDirty(c);

  if (next constraints depend on affected bones) {
    refreshRequiredSubtreeOrBones();
  }
}
```

Simpler V1:
- solver updates affected world transforms immediately.

Optimize dependency refresh later.

Correctness first.

---

## 8. IK interaction

Two-bone IK changes parent/child pose.
Descendants must see updated matrices afterward.

Tests must include:
- path constraint after IK
- transform constraint after IK
- IK after transform constraint
where source order allows.

---

## 9. Path interaction

Path attachment may itself be weighted by bones affected by earlier constraints.

Before path solver:
- ensure path attachment control points are evaluated using current world pose.

This is why path geometry belongs inside runtime dependency layer.

---

## 10. Physics position

Recommended canonical order:
- animation and deterministic rig constraints first
- secondary physics afterward

But imported source semantics may define physics order explicitly.
Canonical model should have order values where needed.

Do not hardcode “physics always last” if compatibility target disproves it.

---

## 11. Deform timing

Animation deform is sampled before mesh world evaluation.

Weighted mesh final vertices use:
- current deform buffer
- final current bone matrices after constraints.

This lets bone constraints affect deformed geometry naturally.

---

## 12. Attachment switching

Timeline attachment switch selects active attachment for slot at sampled time.

Inactive attachment runtime data may remain cached but is not rendered.

When switching to path/mesh:
- invalidate dependent runtime caches as needed.

---

## 13. Draw order

Draw-order timeline produces slot index order.

Renderer receives explicit ordered slot list.

Renderer must not sort by Pixi child insertion as semantic source of truth.

---

## 14. Event order

Events are emitted based on animation timeline traversal, not render traversal.

For multiple tracks:
define deterministic order:
1. track index
2. animation event time
3. authored event order

Document and test.

---

## 15. Paused frame

At dt=0:
- no accidental physics advancement
- no repeated events
- render can still rebuild if editor modified data

Separate `updateSimulation(dt)` from `renderRefresh()` conceptually.

---

## 16. Seeking

```ts
seek(time, mode)
```

Modes:
- stateless animation seek
- accurate-with-physics

Seeking must:
- reset event crossing baseline
- reset or resimulate physics according to mode
- invalidate key cursors

---

## 17. Runtime compile cache

Canonical -> CompiledSkeleton:
- dense indices
- pre-resolved references
- sorted constraints
- compiled timelines
- typed arrays
- mesh structures
- texture references indirect

Compile whenever structural authored data changes.

Property edits may update selective compiled fields later.

---

## 18. Hot reload/editor

Editor can maintain:
- canonical project
- runtime compiled mirror

On command:
1. command reports affected domains
2. runtime bridge decides:
   - update field
   - rebuild mesh
   - rebuild animation
   - full recompile

Avoid full runtime reconstruction after every numeric edit if easy selective update is possible, but start conservative.

---

## 19. Debug pipeline mode

Developer build SHOULD expose step snapshots:

```text
afterAnimation
afterBaseWorld
afterConstraint[0]
afterConstraint[1]
afterPhysics
afterDeform
```

This is invaluable for compatibility diffs.

---

## 20. Acceptance

A runtime feature is not accepted until its evaluation stage/order is stated here or in a feature-specific extension.
