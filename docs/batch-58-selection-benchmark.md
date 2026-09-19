# Batch 58: Large-mesh selection benchmark

- Added `pnpm benchmark:selection` for a deterministic 10,000-vertex selection workload.
- The benchmark warms up the RBush path and reports total and average selection time over 30 samples.
- Latest recorded run is generated from the built authoring package by the command above.

Recorded on 2026-09-20: 10,000 vertices, 30 samples, 3,600 selected, total 270.867 ms, average 9.029 ms/sample.
