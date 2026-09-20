# 16 — Golden Fixture Catalog

Each fixture should contain:
- source file
- atlas/images if required
- expected canonical snapshot
- expected pose samples
- expected diagnostics
- provenance/license
- README

## Spine 3.8.75 mandatory

`sp38_001_region`
`sp38_002_parent_transform`
`sp38_003_negative_scale_x`
`sp38_004_negative_scale_y`
`sp38_005_rotation_wrap`
`sp38_006_mesh`
`sp38_007_weighted_mesh`
`sp38_008_linked_mesh`
`sp38_009_deform`
`sp38_010_skin_switch`
`sp38_011_clipping`
`sp38_012_path_attachment`
`sp38_013_ik_one_bone`
`sp38_014_ik_two_bone`
`sp38_015_ik_reflection`
`sp38_016_transform_constraint`
`sp38_017_path_constraint`
`sp38_018_draw_order`
`sp38_019_slot_color`
`sp38_020_events`
`sp38_021_bezier`
`sp38_022_stepped`
`sp38_023_rotated_atlas`
`sp38_024_missing_atlas`
`sp38_025_3875_repair_case`

## Spine 4.2 mandatory

Mirror core list plus:
`sp42_physics_basic`
`sp42_physics_animated`
`sp42_physics_reset`
`sp42_texture_42`

## DragonBones mandatory

`db55_region`
`db55_mesh`
`db55_weight`
`db55_shared_mesh`
`db55_ffd`
`db55_ik`
`db55_color_offsets`
`db55_nested_armature`
`db55_rotated_atlas`

## Native fixtures

- all attachment types
- all constraints
- all timelines
- unknown extension preservation
- project migration

## Fixture generation

Prefer tiny synthetic fixtures over production characters.
A fixture should test one semantic rule whenever possible.
