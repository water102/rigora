# STEP-05 — Assets, Attachments and Sequences

## Scope

`ASSET-01..06`, `ATT-01..13`, `D43-04`, `D43-08`, `D43-09`.

## Outcome

Product editor quản lý ảnh/audio và author mọi attachment: region, mesh,
bounding box, clipping, path, point, sequence, linked mesh và unknown/nested
preservation. Không capability nào chỉ tồn tại trong Compatibility Lab.

## Preconditions

- STEP-04 rigging/viewport stable.
- Canonical attachment/sequence contract và asset path convention frozen.

## Subplans

### P01 — Asset roots and watcher

- Image/audio roots, normalized relative paths, folders, thumbnails/waveform cache.
- Watch/debounce/rescan/scan cap; missing/stale/case/unsupported diagnostics.
- Used/unused/reference count và safe cleanup preview.

### P02 — Drag/drop and common attachment UI

- Drop image to stage/bone/slot/attachment with target preview.
- Common Select/Export/Name/Color/Set Parent; batch edit và atomic undo.

### P03 — Region and sequence

- Region transform/path/pivot, odd-pixel positioning, region↔mesh conversion.
- Sequence discovery, frame/FPS/mode including reverse variants, missing frames.
- Setup/animation playback and source image reload.

### P04 — Mesh topology productization

- Mesh create/edit/freeze/reset, UV/setup/deformed modes.
- Vertex/edge/triangle/hull/hole, loops, triangulation validation, isolate/dim.
- Generate/trace preview/refresh/apply/cancel; multi-mesh entry points.

### P05 — Linked mesh

- Link/unlink same/cross slot; source navigation; cycle detection.
- Inherit deform and sequence; source change propagation and serialization.

### P06 — Bounding box, clipping, path and point

- Full viewport editors, freeze/reset/weights/deform hooks.
- Clipping end slot, normal/inverse, general/convex hull, self-intersection warning.
- Path knots/handles/closed/constant-speed/reverse; point parenting/skin policy.

### P07 — Unknown/nested and file safety

- Read-only preservation or native policy; never silently discard.
- Image resize strategy, missing asset recovery and path security tests.

## Integration slice

Asset drop → region → mesh/trace → linked cross-slot + sequence → path/bbox/
inverse clipping/point → watcher reload → undo/save/reopen.

## Gate

- Every attachment has create/edit/delete or explicit read-only preservation.
- Linked/deform/sequence and clipping survive native round-trip.
- Watcher/cancel do not corrupt command history.
- F2 attachment/sequence/runtime pose contracts signed.
