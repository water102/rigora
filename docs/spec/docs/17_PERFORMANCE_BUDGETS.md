# 17 — Performance Budgets

These are engineering targets, not promises. Measure before optimization.

## 1. Runtime

Target desktop:
- 60 FPS for representative 200-bone character
- 20 meshes
- 20k weighted vertices total
- several active constraints

Budget at 60 FPS: 16.67 ms total.
Target skeletal evaluation <= 4 ms on a typical modern desktop CPU for stress fixture.

## 2. Editor interaction

- pointer/gizmo feedback: < 16 ms perceived frame budget
- hierarchy operations: < 50 ms typical
- undo simple edit: < 50 ms
- timeline pan/zoom: 60 FPS target
- selection query: < 8 ms typical

## 3. Import/export

Representative project:
- parse/import 10 MB JSON: target < 2 s desktop
- save native project: target < 2 s excluding large image recompression
- atlas pack: worker; must not freeze UI

## 4. Memory

Avoid duplicate full-size image buffers.
Release GPU textures when project closes.
Use streaming/worker decompression for large projects if needed.

## 5. Timeline scale

Design for:
- 10k keys normal
- 50k keys stress
- virtualize rows
- avoid one React component per key if benchmarks fail

## 6. Weight painting

Use spatial index / adjacency.
Brush complexity should depend on nearby vertices, not total mesh vertices.

## 7. Profiling rule

No Rust/WASM rewrite until:
- reproducible benchmark exists;
- profiler identifies hotspot;
- TS optimization attempted;
- expected gain justifies boundary complexity.
