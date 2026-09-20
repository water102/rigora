# STEP-13 — Export, Render, HTML and Texture Packing

## Scope

`EXP-01..10`, `PACK-01..12`, `D43-06`, `D43-17`, `D43-20`, `D43-21`, `D43-24`.

## Outcome

Data/image/animation/video/HTML/atlas export có preset dùng chung UI/CLI,
capability plan, preview, deterministic output, bounded parallelism và atomic
cancel. Texture pack/unpack phủ toàn bộ baseline, gồm per-skin và brute-force.

## Preconditions

- STEP-11 preview/runtime oracle và STEP-12 import/capability registry available.

## Subplans

### P01 — Export planner and presets

- `preserve/convert/bake/drop/block` per capability.
- Versioned preset schema, effective configuration, relative/portable paths.
- Export flags/dependencies/skeleton scope and deterministic ordering.

### P02 — Data export

- Spine 4.3 JSON/binary/atlas P0; native and declared legacy profiles.
- Pretty/minimal/version/nonessential/cleanup/export-all.
- Golden byte/object-graph/round-trip tests.

### P03 — Image and animation render

- GIF/PNG/APNG/PSD/JPEG options, bounds/scale/crop/padding/background/alpha/FPS.
- Preview/estimated output/additive blend policy.

### P04 — Video and audio

- Platform codec/container capability; quality/range/alpha/audio.
- Deterministic event/audio sync and clipping diagnostics.

### P05 — HTML export

- Ready-to-open player/web-component equivalent.
- Animation/skin options and combined skins; portable assets/security policy.

### P06 — Texture pack core

- Rect/grid/polygon, trim/rotation/alias/blank/threshold/padding/bleed/PMA.
- Size/POT/divisible/square/pages/filter/wrap/format/scale/resampling.
- Mesh-aware/current-project behavior and visual preview.

### P07 — Advanced packing/unpacking

- `pack.json` inheritance/combine/flatten/index/legacy/debug/auto-scale/fast/memory.
- Nine-patch/index, rect/polygon unpack, unpremultiply, collision-safe paths.
- Per-skin atlas and missing-region runtime policy.
- Optional brute-force PNG smallest-output with estimates/cancel.

### P08 — Parallel jobs and atomic output

- Bounded worker pool for data/image/video/CLI; deterministic bytes/frames.
- Temp outputs, atomic replace, progress/cancel/retry and partial report.

## Integration slice

Edited project → capability decision → JSON/binary + image/video/audio + HTML →
per-skin atlas → CLI-equivalent preset → validator visual diff → cancel test.

## Gate

- Golden/visual/runtime diff pass for all output families.
- Parallel and sequential outputs equivalent within declared binary/frame policy.
- Cancel never leaves output that appears complete.
- Cross-machine preset/relative path and atlas security tests pass.
