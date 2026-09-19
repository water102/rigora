# 01 — Product Scope

## 1. Product statement

HNN Bones is a local-first, cross-platform 2D skeletal animation authoring environment and runtime toolkit.

It SHALL:
- create/edit skeletal rigs;
- animate bones, slots, attachments, meshes and constraints;
- import DragonBones data;
- import Spine 3.8.x, with explicit 3.8.75 handling;
- import Spine 4.2.x;
- export native HNN project/runtime data;
- export selected compatible subsets to DragonBones and Spine JSON targets;
- render through PixiJS 8;
- expose all editor mutations through commands so UI, scripts and AI agents share one API.

It SHALL NOT initially:
- reproduce Spine's proprietary editor implementation;
- depend on Spine Runtime code;
- require a cloud backend;
- support Spine binary `.skel` in V1;
- promise byte-identical output to Spine;
- silently discard unsupported features on export.

## 2. User personas

### Animator
Needs rigging, timeline, graph editing, mesh/weight tools, preview, skins and export.

### Game developer
Needs deterministic runtime behavior, stable JSON/package formats, Pixi integration, validation and CLI conversion.

### Tooling engineer
Needs explicit schemas, diagnostics, version adapters, capability matrices and reproducible tests.

### AI agent
Needs command-level APIs, structured errors, deterministic file layout and acceptance tests.

## 3. Mandatory V1 capabilities

### Rigging
- Bone hierarchy
- FK transforms
- Slots and draw order
- Region attachments
- Mesh attachments
- Weighted mesh
- Skins
- Clipping
- Bounding boxes
- IK constraints
- Transform constraints
- Path constraints
- Events

### Animation
- Translate / rotate / scale / shear timelines
- Slot color/alpha
- Attachment switching
- Draw order
- Deform/FFD
- Constraint mix timelines
- Curves: linear, stepped, cubic Bezier
- Loop and playback controls
- Dopesheet
- Curve/graph editor

### Editor
- Hierarchy
- Inspector
- Stage viewport
- Pan/zoom
- Transform gizmos
- Bone creation/pose
- Mesh vertex/triangle editing
- Weight painting
- Undo/redo
- Autosave
- Keyboard shortcuts
- Import/export diagnostics

### Compatibility
- Spine 3.8.x family importer
- Spine 3.8.75 explicit profile
- Spine 4.2 importer
- DragonBones 5.5-compatible importer
- Native format importer/exporter
- Spine 3.8-compatible exporter
- Spine 4.2 exporter subset
- DragonBones exporter subset

## 4. Later capabilities

- Physics constraints and bake-to-keys
- Audio/event preview
- Lasso/soft selection
- Auto mesh generation
- Auto weights
- Animation blending/proxy
- Nested armatures
- CLI batch conversion
- Plugins
- Headless render
- WASM hotspots
- Optional collaborative/cloud workflows

## 5. Compatibility definition

“Support” must be broken into:
1. **Parse**
2. **Normalize**
3. **Render**
4. **Edit**
5. **Round-trip preserve**
6. **Export target**
7. **Visual equivalence**

A format is never simply marked “supported” without specifying these dimensions.

## 6. Non-goals

- Clone Spine branding/UI pixel-for-pixel
- Circumvent licensing
- Read proprietary binary formats through reverse engineering
- Support every historical Spine version
- Replace a full rigid-body physics engine
- Make React the scene graph
