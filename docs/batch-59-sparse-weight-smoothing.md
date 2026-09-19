# Batch 59: Sparse weight smoothing

- Added simultaneous graph-neighbor Laplacian smoothing for sparse weight rows.
- Supports strength, locked bones, normalization, and reversible sparse deltas.
- Neighbor reads use a pre-pass so traversal order cannot affect results.
- Validation: `pnpm check`.
