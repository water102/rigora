# Batch 17: Framework-Independent Selection Model

`SelectionStore` provides the editor's transient selection state without coupling the domain to React, Pixi, or Tauri.

## Design goals

- Emit only when the selected entity actually changes.
- Return immutable-by-convention snapshots so UI code cannot mutate internal state silently.
- Keep selection outside authored command history: selecting an entity changes editor focus, not project data.
- Support one active selection, matching the hierarchy/inspector contract.

## Selection kinds

| Kind         | Meaning                           |
| ------------ | --------------------------------- |
| `bone`       | Skeleton bone                     |
| `slot`       | Draw slot                         |
| `attachment` | Region, mesh, or other attachment |
| `constraint` | IK, transform, or path constraint |
| `animation`  | Named animation                   |

## API

`select(selection)` changes the active selection and emits once. Selecting the same `{ kind, id }` is a no-op. `clear()` removes it, while `toggle(selection)` selects or clears the same item. `deselect(kind, id)` clears only when that entity is active. `subscribe(listener)` returns an unsubscribe function.

The `current` getter returns a fresh object:

```ts
const unsubscribe = selection.subscribe((active) => {
  inspector.setEntity(active);
});

selection.toggle({ kind: "bone", id: "upper-arm" });
```
