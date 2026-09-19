# Batch 57: Selection priority UI

- Added canvas modes for edge, face, and boundary selection.
- Non-vertex modes route through the RBush coarse query plus exact geometry test.
- Existing vertex lasso behavior remains available and reports the selected primitive count.
- Validation: `pnpm check`.
