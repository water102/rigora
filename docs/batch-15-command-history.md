# Batch 15: Command Bus and Undo/Redo

Implements `@rigora/editor-core`, a framework-agnostic command bus and history engine, fulfilling the architecture specified in `spec/docs/12_COMMAND_UNDO_AI_ARCHITECTURE.md` and `spec/docs/49_PHASE_4_EDITOR_FOUNDATION.md`.

---

## 1. Core Principles

- **Single Mutation Gateway**: All persistent state mutations must execute as an `EditorCommand`. Direct store mutations bypass undo and break synchronization.
- **Framework Independence**: `CommandHistory` operates on a caller-provided `CommandContext`, keeping editor domain logic completely decoupled from React or DOM APIs.
- **AI-Ready Commands**: Commands use explicit labels, IDs, and payload parameters suitable for AI agent inspection and tool generation.

---

## 2. Key Features

- **Command Merging (`merge`)**:
  - Consecutive commands (such as transform drag, slider adjustments, or continuous rotation) can coalesce into a single history entry via `merge(nextCommand, nextPayload)`.
  - Prevents history bloat and ensures a single undo reverts an entire continuous gesture.
- **Transactions & Grouping**:
  - `beginTransaction(label)` / `commitTransaction()`: Bundles multiple atomic commands into a single undoable compound unit.
  - `rollbackTransaction()`: Automatically rolls back all executed commands in reverse order if a user aborts an action (e.g., pressing Escape during a drag).
  - `transact(fn, label)`: Scoped execution wrapper with automatic rollback on unhandled errors.
- **Dirty-State Tracking**:
  - `markClean()` registers the save point.
  - `isDirty` returns `true` when edits exist relative to the saved point.
  - Bidirectional accuracy: Undoing back to the save point automatically sets `isDirty` to `false`; redoing past it restores `isDirty` to `true`.
- **Bounded History & Clean Reset**:
  - Bounded memory usage via a configurable `limit` (default: 100 entries).
  - `clear()` method resets history stacks and dirty state upon project open/new.
