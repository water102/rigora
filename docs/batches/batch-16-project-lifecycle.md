# Batch 16: Project Repository and Lifecycle

Implements framework-independent project storage contracts and lifecycle operations for the Rigora project package (`@rigora/project`).

---

## 1. Core Contracts

- **`ProjectRepository`**:
  - Abstract asynchronous storage abstraction (`read`, `write`, `remove`, `list`).
  - Completely decoupled from environments (browser OPFS/IndexedDB, Electron/Node file systems, cloud storage).
- **`InMemoryProjectRepository`**:
  - Deterministic in-memory repository for browser adapters, memory buffers, and unit tests.
  - Implements defensive copying via `Uint8Array.slice()` on both read and write boundaries.
  - Returns sorted file keys for deterministic directory listings.

---

## 2. Project Lifecycle Engine (`ProjectLifecycle`)

- **State Machine**:
  - Encapsulates `#project` (`HboneProject | null`), `#path` (`string | null`), and `#dirty` (`boolean`).
- **Unsaved Changes Protection**:
  - Guard checks on `close(discard)`, `newProject(project, discard)`, and `open(path, discard)`.
  - Throws `PROJECT_UNSAVED_CHANGES` when attempting to overwrite or leave dirty state without explicit discard permission.
- **Persistence Operations**:
  - `save()`: Enforces open project (`PROJECT_NOT_OPEN`) and existing path (`PROJECT_SAVE_PATH_REQUIRED`), serializes deterministic `.hbone` package, and clears dirty flag.
  - `saveAs(path)`: Re-targets file path and delegates to `save()`.
  - `open(path)`: Reads from repository, validates existence (`PROJECT_NOT_FOUND`), decodes package with CRC32 checksum verification, and resets clean state.
