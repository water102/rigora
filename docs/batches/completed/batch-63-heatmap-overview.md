# Batch 63: Heatmap overview mode

- Added overview heatmap contributions that show the strongest influence per vertex.
- The same function accepts an optional bone ID for active-bone filtering.
- Values are clamped to the display range `[0, 1]` and missing rows are safe.
- Validation: `pnpm check`.
