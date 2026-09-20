# 58 — Full Project Control Checklist

## Architecture
- [ ] canonical model format-neutral
- [ ] runtime/editor split
- [ ] renderer adapter
- [ ] versioned format adapters
- [ ] command bus mandatory
- [ ] clean-room Spine boundary
- [ ] third-party wrappers

## Model
- [ ] bones
- [ ] slots
- [ ] skins
- [ ] regions
- [ ] meshes
- [ ] weights
- [ ] linked mesh
- [ ] deform
- [ ] clipping
- [ ] path
- [ ] bounding box
- [ ] IK
- [ ] transform constraint
- [ ] path constraint
- [ ] physics
- [ ] events
- [ ] timelines
- [ ] provenance/extensions

## Math
- [ ] affine composition
- [ ] inverse
- [ ] decomposition
- [ ] reflection
- [ ] negative scale
- [ ] shear
- [ ] inheritance modes
- [ ] reparent preserve-world
- [ ] numerical guards

## Animation runtime
- [ ] compile timelines
- [ ] cursor/binary lookup
- [ ] linear
- [ ] stepped
- [ ] Bezier
- [ ] rotation semantics
- [ ] tracks/mixing
- [ ] loop/seek
- [ ] events
- [ ] draw order
- [ ] attachment switch

## Spine 3.8/3.8.75
- [ ] detect/version route
- [ ] source schema
- [ ] bones
- [ ] slots
- [ ] skins
- [ ] regions
- [ ] mesh/weights
- [ ] linked mesh
- [ ] deform
- [ ] clipping/path
- [ ] IK
- [ ] transform/path constraints
- [ ] curves/events
- [ ] exact 3.8.75 profile
- [ ] strict/compatible/repair
- [ ] repair audit
- [x] exporter
- [x] round-trip

## DragonBones
- [ ] schema/version
- [ ] armature/bones
- [ ] slots/displays
- [ ] skins
- [ ] mesh/weights/shared mesh
- [ ] FFD
- [ ] IK
- [ ] events/actions
- [ ] colors
- [ ] nested-armature policy
- [x] exporter
- [x] round-trip

## Spine 4.2
- [x] separate adapter
- [x] delta matrix
- [x] core import
- [ ] mesh/deform
- [ ] constraints
- [ ] texture metadata
- [x] physics mapping
- [ ] export subset
- [ ] downgrade

## Renderer
- [ ] regions
- [ ] CPU-skinned meshes
- [ ] clipping
- [ ] blend modes
- [ ] slot color
- [ ] draw order
- [ ] debug overlays
- [ ] resource cleanup

## Constraints
- [ ] 1-bone IK
- [ ] 2-bone IK
- [ ] reflection
- [ ] nonuniform scale
- [ ] transform strategies
- [ ] path compile/sample
- [ ] path modes
- [ ] dependency/order

## Physics
- [x] config/state
- [x] fixed step
- [x] damping
- [ ] inertia
- [x] gravity/wind
- [x] mix
- [x] reset/seek/prewarm
- [x] bake
- [x] key reduction
- [x] deterministic tests

## Editor
- [x] web shell
- [x] Tauri shell
- [x] docking
- [x] hierarchy
- [x] stage
- [x] inspector
- [x] diagnostics
- [x] history
- [x] lifecycle
- [x] native project
- [x] autosave/recovery

## Commands
- [ ] bone CRUD/reparent/transform
- [ ] slot/attachment
- [ ] constraints
- [x] animation keys
- [x] mesh topology
- [x] weight stroke
- [x] grouping/transaction
- [ ] merge
- [ ] AI command schema

## Timeline/graph
- [x] animation list
- [x] timeline
- [x] snapping
- [x] multi-select
- [x] move/scale/copy keys
- [x] auto key
- [x] graph
- [x] Bezier handles
- [x] events
- [x] slot/constraint channels

## Mesh/weights
- [x] topology editor
- [x] triangulation
- [x] auto contour
- [x] simplification
- [x] auto mesh
- [x] lasso/picking
- [x] binding
- [x] weight add/subtract/replace/erase
- [x] smooth/normalize/lock
- [x] heatmap
- [x] auto weight
- [x] sparse undo
- [x] deform authoring

## Import/export
- [ ] detector registry
- [ ] source ASTs
- [ ] validation
- [ ] repair
- [ ] canonicalization
- [ ] asset resolution
- [x] capability scanner
- [x] export planner
- [ ] bake integration
- [x] deterministic serializers
- [x] reports

## Native format
- [ ] manifest
- [ ] skeletons
- [ ] assets
- [ ] editor state
- [ ] provenance
- [ ] checksums
- [ ] migration
- [ ] atomic save
- [ ] recovery

## Tests
- [ ] unit
- [ ] property
- [ ] parser
- [ ] semantic fixtures
- [ ] numeric pose
- [ ] vertex diff
- [ ] visual diff
- [ ] round-trip
- [ ] E2E
- [ ] fuzz
- [ ] security
- [ ] performance
- [ ] migration
- [ ] recovery

## Release/legal
- [ ] dependency ledger
- [ ] licenses reviewed
- [ ] notices
- [ ] SBOM
- [ ] asset/font/icon licenses
- [ ] clean-room record
- [ ] precise compatibility claims

## Release candidate
- [ ] M0
- [ ] M1
- [ ] M2
- [ ] M3
- [ ] M4
- [ ] M5
- [ ] M6
- [x] M7
- [ ] M8
- [ ] M9
- [ ] zero critical known issue
