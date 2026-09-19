# Batch 24: Editor Shell, Stage UI & Desktop Foundation

Batch 24 closes Phase 4 (Editor Foundation) by integrating all editor primitives into a reactive authoring shell:

## 1. Web Shell (`apps/editor-shell`)

- **React 19 & Vite**: Clean modular application container with `<ErrorBoundary>` protection.
- **Docking Layout**: `flexlayout-react` docking system with customizable panels (`Hierarchy`, `Stage`, `Inspector`, `Timeline`, `Diagnostics`, `History`), persisted through `EditorPreferencesStore`.
- **EditorServices Context**: Pure dependency injection container providing `project`, `commands` (`CommandHistory`), `selection` (`SelectionStore`), and `preferences`.

## 2. Interactive Stage UI

- **PixiJS 8 Application**: High-performance canvas rendering real skeleton bones and joints with WebGL/WebGPU.
- **Camera2D Integration**: Zoom-at-cursor (`wheel`), smooth pan (`pointerdown` middle/right button drag), world-to-screen and screen-to-world coordinate transformations.
- **Dynamic Grid**: Major/minor coordinate grid computed dynamically via `buildGridLines()`.
- **Geometric Hit-Testing**: Orthogonal line-segment projection distance formula:
  $$t = \text{clamp}\left(\frac{(\vec{P} - \vec{A}) \cdot (\vec{B} - \vec{A})}{\|\vec{B} - \vec{A}\|^2}, 0, 1\right)$$
  enables clicking anywhere along the bone body to select it.

## 3. Reactive Hierarchy & Inspector

- **Two-Way Binding**: Hierarchy subscribes to both selection and command events, displaying live bones from `services.project`.
- **Undoable Mutations**: Inspector field changes dispatch commands into `CommandHistory`. Executing or undoing/redoing reflects immediately in both Inspector and Hierarchy.

## 4. Project Lifecycle & Autosave

- **Native Project Format (`.hbone`)**: Full New, Open, Save, and Save As support with CRC32 integrity verification.
- **Autosave Controller**: Background debounced snapshot persistence (`*.hbone.autosave`) and startup crash recovery prompt.
- **Keyboard Shortcuts**: `Ctrl+Z` (Undo), `Ctrl+Y` / `Ctrl+Shift+Z` (Redo), and `Ctrl+S` (Save).

## 5. Tauri 2 Desktop Shell

- Standalone native desktop configuration in `src-tauri/` with `Cargo.toml`, `tauri.conf.json`, and window lifecycle management.
