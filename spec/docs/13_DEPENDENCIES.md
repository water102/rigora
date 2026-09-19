# 13 — Dependency Strategy

## 1. Policy

Before custom implementation:
1. search maintained libraries;
2. verify license;
3. verify bundle/browser compatibility;
4. benchmark;
5. wrap library behind local interface;
6. add replacement test.

Dependencies are implementation details, not domain contracts.

## 2. Proposed stack

| Area | Candidate | Use |
|---|---|---|
| Rendering | PixiJS 8 | stage/runtime GPU renderer |
| Viewport | pixi-viewport | pan/zoom/camera behavior |
| UI | React | panels/shell |
| Build | Vite | web frontend |
| Desktop | Tauri 2 | desktop packaging/fs/dialogs |
| State | Zustand | editor application state |
| Undo helper | zundo | optional temporal helper |
| Docking | FlexLayout React | IDE-style panels |
| Tree | react-arborist | hierarchy/library tree |
| UI primitives | Radix UI | accessible primitives |
| Forms | react-hook-form + Zod | property forms/validation |
| Math | gl-matrix | vector/matrix helpers |
| Triangulation | earcut | polygons |
| Delaunay | delaunator | point triangulation |
| Spatial index | rbush | hit/search acceleration |
| Bezier | bezier-js | curve/path math |
| Polygon boolean | polygon-clipping | vector/clipping operations |
| Packing | maxrects-packer | atlas placement |
| ZIP | fflate | native project package |
| Worker RPC | Comlink | worker APIs |
| IndexedDB | Dexie | web autosave/cache |
| Testing | Vitest | unit |
| E2E | Playwright | UI |
| Package mgmt | pnpm | workspace |

## 3. DragonBones

DragonBonesJS is MIT and may be:
- referenced,
- forked,
- extracted,
- adapted,

provided MIT notice requirements are respected.

Use DragonBones algorithms only through wrappers/refactored modules so canonical architecture remains independent.

## 4. Spine runtimes

Do not make official Spine runtime code a production dependency for an open clean-room implementation.

If used internally as a test oracle, keep it isolated and review licensing before distribution/use.

## 5. Dependency acceptance checklist

For each package record:
- package
- exact version
- source repo
- license
- transitive risk
- browser support
- maintenance activity
- bundle impact
- security advisories
- wrapper interface
- fallback/replacement

## 6. Locking

Use lockfile.
Renovate/Dependabot may propose updates, but renderer/math dependencies require golden-test suite before merge.


## 7. Algorithm ownership

The package selection must follow `25_ALGORITHM_CATALOG.md`.
Geometry libraries are adapters, while transform/constraint/skinning compatibility remains HNN-owned behavior.
