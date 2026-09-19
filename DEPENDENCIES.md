# Direct dependency ledger

Batch 6 dependencies:

| Package          | Version | License    | Repository                              | Boundary                                   |
| ---------------- | ------- | ---------- | --------------------------------------- | ------------------------------------------ |
| pixi.js          | 8.21.0  | MIT        | https://github.com/pixijs/pixijs        | renderer-pixi, preview app, renderer tests |
| vite             | 8.3.0   | MIT        | https://github.com/vitejs/vite          | Preview dev server and bundle only         |
| @playwright/test | 1.63.0  | Apache-2.0 | https://github.com/microsoft/playwright | Browser verification only                  |

Versions/licenses verified against registry metadata; Pixi license also inspected locally. No library modifications. Preview build currently emits approximately 589 kB JavaScript across chunks (171 kB gzip); this includes Pixi backend chunks and model validation. This is a build baseline, not a gameplay performance qualification. Browser/WebGL support is exercised in Chromium; other GPUs/browsers and complete transitive license/security review remain release work. Pixi is replaceable at the RenderSnapshot boundary. Texture loading remains caller-owned.

Dependencies are unmodified. Development tools are invoked through project scripts. Zod is isolated behind the model's schema/validation boundary.

Runtime dependency: Zod 3.25.76, MIT, https://github.com/colinhacks/zod — canonical I/O schemas in `@rigora/model`.

### Spec-analyzed candidate libraries (spec/docs/13_DEPENDENCIES.md)

| Category                 | Package              | Version | License    | Repository                                         | Primary Purpose / Boundary                                              |
| ------------------------ | -------------------- | ------- | ---------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| Geometry / Triangulation | `earcut`             | ^3.2.3  | ISC        | https://github.com/mapbox/earcut                   | Polygon triangulation adapter (`@types/earcut`)                         |
| Geometry / Delaunay      | `delaunator`         | ^5.1.0  | ISC        | https://github.com/mapbox/delaunator               | Point-set triangulation / Delaunay mesh generator (`@types/delaunator`) |
| Spatial Index            | `rbush`              | ^4.0.1  | MIT        | https://github.com/mourner/rbush                   | 2D R-tree spatial index for viewport hit testing (`@types/rbush`)       |
| Curves & Paths           | `bezier-js`          | ^6.1.4  | MIT        | https://github.com/Pomax/bezierjs                  | Cubic easing and path constraint curve evaluation (`@types/bezier-js`)  |
| Geometry / Booleans      | `polygon-clipping`   | ^0.15.7 | MIT        | https://github.com/mfogel/polygon-clipping         | Polygon boolean & clipping operations                                   |
| Math / Linear Algebra    | `gl-matrix`          | ^3.4.4  | MIT        | https://github.com/toji/gl-matrix                  | Vector & affine matrix calculations                                     |
| Atlas Packing            | `maxrects-packer`    | ^2.7.3  | MIT        | https://github.com/soimy/maxrects-packer           | Texture atlas bin-packing                                               |
| Archive & Compression    | `fflate`             | ^0.8.3  | MIT        | https://github.com/101arrowz/fflate                | Fast lossless ZIP / unzip for `.hbone` native projects                  |
| Web Worker RPC           | `comlink`            | ^4.4.2  | Apache-2.0 | https://github.com/GoogleChromeLabs/comlink        | Offloading compute-heavy tasks to Web Workers                           |
| Local Persistence        | `dexie`              | ^4.4.6  | Apache-2.0 | https://github.com/dexie/Dexie.js                  | IndexedDB wrapper for local autosave & project cache                    |
| UI Framework             | `react`, `react-dom` | ^19.3.0 | MIT        | https://github.com/facebook/react                  | Studio UI panels, hierarchy, and inspector                              |
| Viewport / Camera        | `pixi-viewport`      | ^6.0.3  | MIT        | https://github.com/davidfig/pixi-viewport          | Pan/zoom/camera interaction for PixiJS stage                            |
| State Management         | `zustand`            | ^5.0.15 | MIT        | https://github.com/pmndrs/zustand                  | Studio state store                                                      |
| Undo / History           | `zundo`              | ^2.3.0  | MIT        | https://github.com/charkour/zundo                  | Temporal undo/redo history middleware for Zustand                       |
| Docking Layout           | `flexlayout-react`   | ^0.11.0 | MIT        | https://github.com/caplin/FlexLayout               | IDE-style multi-panel docking shell                                     |
| Hierarchy Tree           | `react-arborist`     | ^3.16.0 | MIT        | https://github.com/brimdata/react-arborist         | Virtualized scene graph & bone hierarchy tree                           |
| Property Forms           | `react-hook-form`    | ^7.88.0 | MIT        | https://github.com/react-hook-form/react-hook-form | Inspector form binding with Zod validation                              |
| Client-Side Routing      | `react-router`       | ^8.4.0  | MIT        | https://github.com/remix-run/react-router          | Application routing and URL navigation shell                            |

Batch 5 adds only workspace dependencies: format-common uses model/diagnostics; the Spine adapter uses format-common, format-spine-common and model; the DragonBones adapter uses format-common and model. No source runtime dependency was added.

| Package    | Version | License    | Repository                              | Use / boundary           |
| ---------- | ------- | ---------- | --------------------------------------- | ------------------------ |
| TypeScript | 5.9.2   | Apache-2.0 | https://github.com/microsoft/TypeScript | Compiler; build scripts  |
| Vitest     | 3.2.4   | MIT        | https://github.com/vitest-dev/vitest    | Test runner; tests only  |
| Prettier   | 3.6.2   | MIT        | https://github.com/prettier/prettier    | Formatting; scripts only |

pnpm 10.16.1 (MIT, https://github.com/pnpm/pnpm) manages the workspace. Exact transitive versions are recorded in pnpm-lock.yaml; this direct ledger is not a full release SBOM.
