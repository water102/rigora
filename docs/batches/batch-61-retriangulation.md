# Batch 61: Topology retriangulation

- Added `retriangulate` for selected vertex rings using the canonical polygon triangulator.
- Rebuilds explicit adjacency edges while preserving stable vertex IDs and positions.
- Rejects invalid or undersized rings.
- Validation: `pnpm check`.
