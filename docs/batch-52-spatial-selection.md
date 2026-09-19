# Batch 52: Spatial mesh selection

- Added an RBush-backed coarse bounds index for mesh selection.
- Exact point-in-polygon checks are applied after the coarse query.
- Supports vertex, edge, face, and boundary priority modes with deterministic results.
- Validation: `pnpm check`.
