# Rigora

Rigora is a format-neutral 2D skeletal animation engine, runtime, and authoring editor. It provides deterministic mathematical evaluation, clean-room compatibility with Spine 3.8 and DragonBones, and a local-first reactive authoring environment.

---

## Workspace Architecture

### Applications (`apps/` & `src-tauri/`)

- **`apps/editor-shell`**: Modern React 19 + Vite desktop/web editor shell featuring FlexLayout docking, PixiJS 8 stage canvas with Camera2D, dynamic grid, segment hit-testing, reactive Hierarchy tree, Inspector property forms with CommandHistory undo/redo, `.hbone` native project lifecycle, and background autosave recovery.
- **`apps/compatibility-lab`**: Interactive laboratory for dual-format (Spine 3.8 and DragonBones) visual testing and runtime validation.
- **`src-tauri/`**: Tauri 2 desktop shell configuration for native desktop builds on Windows, macOS, and Linux.

### Core & Domain Packages (`packages/`)

- **`@rigora/math`**: Canonical coordinates (X right, Y up, CCW radians), affine matrix operations, scale-aware decomposition, and preserve-world reparenting.
- **`@rigora/diagnostics`**: Source-locatable diagnostics, error categorisation, and diagnostic collection.
- **`@rigora/model`**: Format-neutral canonical skeleton schema, strict boundary validation, and versioned snapshots.
- **`@rigora/animation`**: Timeline compilation, cursor search, linear/stepped/Bezier interpolation, rotation wrapping, and event dispatch.
- **`@rigora/runtime`**: Constraint evaluation (1-bone IK, 2-bone IK, transform constraint, path geometry and arc-length sampling), animated playback, and time scrubbing.
- **`@rigora/renderer-pixi`**: PixiJS 8 rendering pipeline supporting CPU-skinned meshes, weighted deform, blend modes, and debug overlays.
- **`@rigora/authoring-mesh`**: Delaunay triangulation, automatic bone weighting, and Web Worker thread RPC.
- **`@rigora/format-spine-38`**: Clean-room Spine 3.8 / 3.8.75 import adapter and schema mapping.
- **`@rigora/format-dragonbones`**: DragonBones 5.5 / 6.0 import adapter with unsupported-constraint diagnostics.
- **`@rigora/format-export`**: Deterministic Spine 3.8/3.8.75 and DragonBones 5.5 serializers, capability scanning, interactive export planning, atlas packing, and round-trip verification.
- **`@rigora/project`**: Native `.hbone` ZIP/CRC32 persistence, project repository abstraction, ProjectLifecycle, and AutosaveManager/Controller.
- **`@rigora/editor-core`**: Foundation editor services: CommandHistory (transactions, merging, subscriptions), SelectionStore, Camera2D, Grid mathematical snapping, HierarchyModel, InspectorModel, and EditorPreferencesStore.

---

## Getting Started

Requires **Node.js 22+** and **pnpm 10.16.1**.

### Installation & Verification

```sh
pnpm install
pnpm check      # Runs typecheck, linter, vitest unit tests, and production builds
```

### Running Applications

```sh
# Run the interactive React Editor Shell
pnpm --filter @rigora/editor-shell dev

# Run the Compatibility Lab
pnpm dev

# Run the Desktop App (requires Rust/Cargo)
pnpm tauri:dev
```

---

## Roadmap & Phase Status

| Phase       | Description                                                                         |   Status    |
| ----------- | ----------------------------------------------------------------------------------- | :---------: |
| **Phase 0** | Specification and Corpus                                                            | ✅ Complete |
| **Phase 1** | Runtime Proof of Concept                                                            | ✅ Complete |
| **Phase 2** | Mesh, Skin, Deform & Pixi Renderer                                                  | ✅ Complete |
| **Phase 3** | Constraints (IK, Transform, Path Constraints)                                       | ✅ Complete |
| **Phase 4** | Editor Foundation (Shell, Docking, Stage, Hierarchy, Inspector, Lifecycle, Tauri 2) | ✅ Complete |
| **Phase 5** | Animation Authoring (Timeline, Dope Sheet, Curves, Keyframes)                       | ✅ Complete |
| **Phase 6** | Mesh & Weight Authoring UI                                                          | ✅ Complete |
| **Phase 7** | Export Compatibility (Spine / DragonBones / Native)                                 | ✅ Complete |
| **Phase 8** | Spine 4.2 & Physics Engine                                                          |   🚀 Next   |
