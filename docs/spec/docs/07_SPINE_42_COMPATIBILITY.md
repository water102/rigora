# 07 — Spine 4.2 Compatibility

## 1. Scope

Spine 4.2 is a separate adapter family, not an extension of the 3.8 parser.

Mandatory V1 import:
- bones/transforms
- slots
- skins
- region/mesh
- weights
- deform
- clipping/path/bounding box
- IK
- transform constraint
- path constraint
- events
- animation curves
- draw order

Physics constraints are canonicalized if represented by our schema; full semantic equivalence is a staged deliverable.

## 2. Evidence baseline

LoongBones release notes document added import for Spine 4.2 texture data and physics constraints, and fixes related to Spine 4.2 export. This is useful evidence that cross-model conversion is feasible, but HNN implementations must remain clean-room.

## 3. Version detection

Exact source patch is preserved.
Family routing uses `4.2`.

Unknown 4.x MUST NOT automatically route to 4.2 without validation.

## 4. Capability downgrade

When exporting canonical data to Spine 3.8:
- 4.2-only physics -> bake/remove/error
- newer attachment/timeline semantics -> convert if deterministic, otherwise warning/error
- unknown 4.2 extensions -> preserve only in native project metadata

## 5. Physics

Physics data SHALL have:
- explicit canonical parameters;
- setup values;
- animation timeline support where applicable;
- deterministic update step;
- bake-to-keyframes API.

Do not copy physics solver code from official Spine runtimes.

## 6. Test strategy

Use:
- parser fixtures
- semantic pose snapshots
- deterministic physics samples
- exporter re-import tests
- image comparison at key timestamps

## 7. Diagnostics

Prefix: `SP42_`.

Examples:
- `SP42_PHYSICS_UNSUPPORTED_PARAMETER`
- `SP42_PHYSICS_BAKE_REQUIRED`
- `SP42_ATTACHMENT_TYPE_UNKNOWN`
- `SP42_EXPORT_DOWNGRADE_LOSS`
