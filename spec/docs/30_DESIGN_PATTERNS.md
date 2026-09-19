# 30 — Design Patterns: Recommended, Conditional and Avoided

This project should use patterns to protect boundaries, not to maximize abstraction.

---

# 1. Adapter — REQUIRED

Use for:
- Spine 3.8
- Spine 4.2
- DragonBones
- Pixi renderer
- filesystem/Tauri
- third-party geometry libraries

Example:

```ts
interface SkeletonImporter<TSource> {
  detect(input: unknown): boolean;
  import(input: TSource, options: ImportOptions): ImportResult;
}
```

Why:
- isolates version/library APIs;
- makes replacement possible;
- prevents canonical model contamination.

---

# 2. Strategy — REQUIRED for semantic variants

Use for:
- transform inheritance modes;
- curve evaluation;
- export downgrade resolution;
- constraint modes;
- renderer backends;
- auto-weight algorithms.

Avoid giant switches repeated in many packages.

Example:

```ts
interface WeightGenerator {
  generate(mesh: MeshData, rig: SkeletonData): WeightResult;
}
```

---

# 3. Command — REQUIRED

All persistent editor mutations.

Benefits:
- undo/redo;
- macros;
- AI commands;
- audit/history;
- testability.

Do not use Command for transient hover or camera drag unless it persists authored state.

---

# 4. Memento — CONDITIONAL

Use for:
- snapshots at transaction boundaries;
- recovery/autosave;
- complex changes where inverse operation is expensive.

Do not store the entire project for every mouse move.

Prefer sparse command deltas for normal undo.

---

# 5. Composite — NATURAL FIT

Bone hierarchy, UI tree, nested armature relationships conceptually form trees.

Use tree traversal helpers, but do not force every domain entity into a generic `Node` base class.

Composition over inheritance.

---

# 6. Observer / Event Bus — CONTROLLED USE

Use typed events for:
- command committed;
- selection changed;
- runtime animation event;
- asset loaded;
- diagnostics changed.

Avoid a global stringly-typed event bus.

Prefer:

```ts
type EditorEvents = {
  commandCommitted: CommandReport;
  selectionChanged: Selection;
};
```

Events must not become hidden business logic.

---

# 7. State Machine — RECOMMENDED

Use finite state machines for interaction tools:

```text
Idle
 -> Hover
 -> Dragging
 -> Commit/Cancel
```

Especially:
- bone creation;
- mesh editing;
- weight painting;
- transform gizmos;
- marquee/lasso.

This prevents scattered pointer flags.

A library like XState is optional; simple local typed state machines may be enough.

---

# 8. Pipeline — REQUIRED

Importer and exporter are pipelines.

Import:
```text
parse -> validate -> normalize -> repair -> canonicalize -> validate
```

Runtime:
```text
sample -> mix -> transforms -> constraints -> deform -> render snapshot
```

Each stage should have explicit inputs/outputs.

---

# 9. Chain of Responsibility — USE SPARINGLY

Useful for:
- asset resolution search roots;
- diagnostic enrichment;
- export downgrade handler chain.

Avoid for core animation evaluation where explicit order is clearer.

---

# 10. Repository — USE FOR PERSISTENCE BOUNDARY

Example:
```ts
interface ProjectRepository {
  load(uri: ProjectUri): Promise<HnnProject>;
  save(project: HnnProject, uri: ProjectUri): Promise<void>;
}
```

Allows:
- browser IndexedDB;
- Tauri filesystem;
- tests in memory.

Do not create repositories for every in-memory entity.

---

# 11. Factory — CONDITIONAL

Good for:
- runtime instances from immutable data;
- attachment runtime objects;
- renderer resources.

Avoid “FactoryFactory” layers.

---

# 12. Flyweight — RECOMMENDED for immutable/shared assets

Share:
- textures;
- atlas regions;
- immutable skeleton data;
- curves/LUTs where safe.

Do not duplicate image/atlas buffers per skeleton instance.

---

# 13. Facade — RECOMMENDED for public SDK

Expose a small API:

```ts
const project = await Hnn.load(...)
const instance = project.createSkeleton(...)
instance.play(...)
```

Hide internal package complexity.

---

# 14. Dependency Injection — LIGHTWEIGHT

Inject interfaces for:
- clock;
- filesystem;
- image decoder;
- worker pool;
- logger;
- renderer.

Do not adopt a heavyweight DI container unless clearly necessary.

Constructor/function injection is enough.

---

# 15. Visitor — GENERALLY AVOID

A classic Visitor over every attachment/timeline type makes schema evolution painful.

Prefer:
- discriminated unions;
- exhaustive TypeScript switches at localized boundaries;
- registries for plugins.

Visitor may be useful for a stable compiler-like AST, but our model evolves frequently.

---

# 16. Entity Component System — AVOID for V1

Skeletal animation has strong ordered/domain-specific relationships.
An ECS would add indirection without solving the main problems.

Pixi also already provides scene/display abstractions.

Reconsider only if a separate game-runtime ECS adapter is requested.

---

# 17. Event Sourcing — DO NOT USE as core persistence

Commands/history resemble event sourcing, but a full event-sourced project store creates migration and replay complexity.

Use:
- snapshot as source of truth;
- bounded command history for undo;
- optional macro/audit log.

---

# 18. CQRS — AVOID as formal architecture

Separating commands from read selectors is useful conceptually, but full CQRS infrastructure is unnecessary for a local editor.

---

# 19. Prototype — USE for duplication

Clone authored entities through explicit copy functions that generate new stable IDs and update internal references.

Do not rely on JS prototype cloning.

---

# 20. Null Object — CONDITIONAL

Can simplify optional renderer placeholders or “no attachment”, but do not hide missing data errors.

---

# 21. Object Pool — PROFILE FIRST

Potential for:
- runtime event objects;
- temporary numeric buffers.

Do not pool ordinary editor objects prematurely.

Typed reusable arrays are often sufficient.

---

# 22. Immutable Data — SELECTIVE

Canonical authored data benefits from predictable immutable-style updates at command boundaries.

Runtime hot state must be mutable for performance.

Do not force immutable data structures into per-frame loops.

---

# 23. Pattern map by subsystem

| Subsystem | Primary patterns |
|---|---|
| Format import/export | Adapter, Pipeline, Strategy |
| Runtime | Strategy, Flyweight, Facade |
| Constraints | Strategy, ordered Pipeline |
| Editor mutations | Command, selective Memento |
| Interaction tools | State Machine |
| Persistence | Repository |
| Renderer | Adapter, Facade |
| AI | Command + schema |
| Assets | Flyweight + Repository |
| Diagnostics | Pipeline / typed Observer |

---

# 24. Anti-patterns to reject in code review

- God `EditorStore`
- God `Skeleton` class
- `if (spineVersion...)` outside format packages
- renderer deciding animation semantics
- React components mutating model directly
- global mutable singleton for project state
- stringly typed events/commands
- inheritance-heavy attachment class tree
- third-party types leaking through public domain APIs
- full-project deep clone on every edit
- hidden side effects in getters
