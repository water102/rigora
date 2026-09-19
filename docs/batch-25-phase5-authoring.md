# Batch 25 — Phase 5 Animation Authoring Core

This batch closes the renderer-independent authoring foundation for Phase 5. The
`@rigora/animation` authoring store now covers clip metadata, channels, keys,
selection, snapping, multi-key operations, curves, auto-key, playback, events,
canonical import/export and atomic history transactions. The editor shell exposes
these operations through the Timeline panel.

## Stress probe

The built-in `benchmarkAuthoringKeys` probe was run on the local development
machine after a clean build:

|        Case |   Select |     Move | Selected |
| ----------: | -------: | -------: | -------: |
| 10,000 keys | 0.216 ms | 0.437 ms |    5,001 |
| 50,000 keys | 0.743 ms | 0.680 ms |   25,001 |

These timings are indicative rather than CI thresholds; they measure the core
selection and move loops and exclude DOM rendering. The probe reports both cases
as usable. The editor shell now uses a virtualized row window, horizontal
playhead auto-scroll, and a graph view so large timelines do not require all
rows to be mounted at once.

## Verification

- `pnpm check`
- 16 test files, 171 tests passing
- Typecheck, formatting/boundary lint and workspace builds passing
