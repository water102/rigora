# Batch 14: Native `.hbone` Project Persistence

Implements `@rigora/project`, the official container and persistence layer for native HNN Bones projects (`.hbone`), fulfilling the requirements of `spec/docs/18_NATIVE_FILE_FORMAT.md` and `spec/docs/49_PHASE_4_EDITOR_FOUNDATION.md`.

---

## 1. Container Structure

A `.hbone` file is a ZIP-compatible archive containing:

- `manifest.json`: Project metadata, schema version, generator, asset index, and deterministic CRC-32 checksums.
- `skeletons/${id}.json`: Canonical snapshot for each skeleton, parsed and validated via `@rigora/model`.
- `assets/**`: Binary assets such as texture atlases, PNG images, and audio files.
- `editor/state.json`: Optional editor workspace state (viewport pan/zoom, selected entity IDs, active timeline state).
- `provenance/**`: Lineage and metadata for imported external source files (e.g., Spine JSON, DragonBones JSON).

---

## 2. Key Features

- **Deterministic Serialization**:
  - Keys are sorted lexicographically with consistent indentation (2 spaces).
  - Checksums are automatically computed for all packaged artifacts to detect corruption.
- **Binary Asset Packaging**:
  - Full support for reading and writing binary assets (`Uint8Array`) stored under `assets/*`.
- **Integrity & Checksums**:
  - Fast, dependency-free CRC-32 hash calculation.
  - Optional checksum verification on project load (`verifyChecksums: true`).
- **Robust Error Handling**:
  - Specific errors thrown for corrupted archives (`NATIVE_CORRUPT_ARCHIVE`), missing manifest (`NATIVE_MISSING_MANIFEST`), invalid project formats (`NATIVE_INVALID_PROJECT`), and missing skeleton snapshots (`NATIVE_MISSING_SKELETON`).
- **Extensions Bag**:
  - Preserves third-party plugin data in `extensions` without modifying the core domain model.
