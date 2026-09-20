# Rigora Phase 9 performance evidence

## Environment

- Date: 2026-09-20
- Node: v26.3.1
- Commands: `pnpm benchmark:selection`, `node tools/benchmark-skinning.mjs`
- These are repeatable smoke benchmarks, not cross-machine qualification.

## Results

| Workload       |                             Fixture |          Result |          Budget | Status    |
| -------------- | ----------------------------------: | --------------: | --------------: | --------- |
| Mesh selection |         10,000 vertices, 30 samples | 8.833 ms/sample |  < 8 ms typical | attention |
| CPU skinning   | 10,000 vertices / 20,000 influences |  0.223 ms/frame | runtime <= 4 ms | pass      |

Selection is slightly above the typical interaction target and is retained as
an optimization candidate. No optimization is claimed without profiling. The
skinning smoke benchmark is comfortably below the runtime evaluation budget.

## Reproduction

```text
pnpm benchmark:selection
node tools/benchmark-skinning.mjs
```
