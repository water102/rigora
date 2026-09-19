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
- [ ] exporter
- [ ] round-trip

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
- [ ] exporter
- [ ] round-trip

## Spine 4.2
- [ ] separate adapter
- [ ] delta matrix
- [ ] core import
- [ ] mesh/deform
- [ ] constraints
- [ ] texture metadata
- [ ] physics mapping
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
- [ ] config/state
- [ ] fixed step
- [ ] damping
- [ ] inertia
- [ ] gravity/wind
- [ ] mix
- [ ] reset/seek/prewarm
- [ ] bake
- [ ] key reduction
- [ ] deterministic tests

## Editor
- [ ] web shell
- [ ] Tauri shell
- [ ] docking
- [ ] hierarchy
- [ ] stage
- [ ] inspector
- [ ] diagnostics
- [ ] history
- [ ] lifecycle
- [ ] native project
- [ ] autosave/recovery

## Commands
- [ ] bone CRUD/reparent/transform
- [ ] slot/attachment
- [ ] constraints
- [ ] animation keys
- [ ] mesh topology
- [ ] weight stroke
- [ ] grouping/transaction
- [ ] merge
- [ ] AI command schema

## Timeline/graph
- [ ] animation list
- [ ] timeline
- [ ] snapping
- [ ] multi-select
- [ ] move/scale/copy keys
- [ ] auto key
- [ ] graph
- [ ] Bezier handles
- [ ] events
- [ ] slot/constraint channels

## Mesh/weights
- [ ] topology editor
- [ ] triangulation
- [ ] auto contour
- [ ] simplification
- [ ] auto mesh
- [ ] lasso/picking
- [ ] binding
- [ ] weight add/subtract/replace/erase
- [ ] smooth/normalize/lock
- [ ] heatmap
- [ ] auto weight
- [ ] sparse undo
- [ ] deform authoring

## Import/export
- [ ] detector registry
- [ ] source ASTs
- [ ] validation
- [ ] repair
- [ ] canonicalization
- [ ] asset resolution
- [ ] capability scanner
- [ ] export planner
- [ ] bake integration
- [ ] deterministic serializers
- [ ] reports

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
- [ ] M7
- [ ] M8
- [ ] M9
- [ ] zero critical known issue
