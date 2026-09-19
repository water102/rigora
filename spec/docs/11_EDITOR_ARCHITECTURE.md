# 11 — Editor Architecture

## 1. UI split

React:
- menus
- docking
- panels
- dialogs
- inspector
- settings
- asset browser

Pixi:
- stage
- skeleton display
- mesh
- bones/gizmos
- weight heatmap
- onion skin
- guides
- selection overlays

Timeline may start with a React timeline library, but must expose a renderer-independent model so a Canvas/Pixi renderer can replace it later.

## 2. Main panels

- Library
- Hierarchy/Outline
- Stage
- Inspector
- Timeline/Dopesheet
- Graph
- Mesh
- Weight
- Diagnostics
- Export report
- History
- Console/Agent

## 3. Tools

```ts
type EditorTool =
  | "select"
  | "bone-create"
  | "pose"
  | "mesh-edit"
  | "weight"
  | "path"
  | "clip"
  | "pan";
```

Tools own temporary interaction state only.
Persistent changes go through commands.

## 4. Selection model

Support:
- single
- multi
- rectangle
- lasso
- hierarchy-linked selection
- vertex/edge/face sub-selection
- keyboard navigation

Selection IDs reference canonical stable IDs.

## 5. Viewport

Use a camera abstraction with:
- screen <-> world transforms
- zoom around cursor
- pan
- clamp
- frame selection
- frame all
- grid/snap

pixi-viewport is a candidate implementation but must be wrapped.

## 6. Inspector

Schema-driven inspector preferred:
- transform
- slot
- attachment
- constraints
- timeline properties

All edits are validated before command commit.

## 7. Timeline

Model:
- rows
- channels
- keys
- ranges
- playhead
- selection

Required:
- box select
- move
- scale time
- duplicate
- delete
- copy/paste
- snap
- multi-key value edit
- loop range

## 8. Graph editor

Required:
- Bezier handles
- stepped/linear modes
- multi-curve overlay
- frame/value grid
- tangent/handle selection
- fit selection/all
- numeric edit

Bezier math should use a library; interaction remains custom.

## 9. Mesh editor

Modes:
- vertex
- edge
- triangle
- boundary
- UV

Use existing triangulation libraries.
Maintain explicit user edges separately from generated triangulation when needed.

## 10. Weight editor

Capabilities:
- bind/unbind bones
- brush add/subtract
- smooth
- normalize
- erase
- lock influences
- max influences
- heat map
- numeric table
- soft selection
- lasso

Every stroke should be one undoable command with compressed delta payload.

## 11. Autosave

Autosave writes native project snapshots/deltas, never source Spine/DragonBones files.
