# Batch 10 — Studio Authoring Lab: Automated Mesh and Weights

This batch implements automated mesh generation and weight computation defined in [the LoongBones addendum](../plans/loongbones-spec-addendum.md) and [Spec 28 Mesh Geometry & Weight Algorithms](../spec/docs/28_MESH_GEOMETRY_AND_WEIGHT_ALGORITHMS.md).

## Implemented

### 1. Package `@rigora/authoring-mesh`

- **Polygon Triangulation (`triangulatePolygon`)**:
  - Triangulates arbitrary 2D polygon boundaries with optional holes via `earcut`.
  - Automatically calculates bounding-box normalized UV coordinates `[0, 1]`.
- **Regular Grid Mesh Generation (`generateGridMesh`)**:
  - Generates parameterized subdivisions (cols × rows) for deformable surface meshes and cloth.
- **Delaunay Point-Set Triangulation (`triangulatePoints`)**:
  - Point-set meshing via `delaunator` for internal vertex distributions.
- **Inverse Distance Auto-Weighting (`computeAutoWeights`)**:
  - Geometric point-to-bone segment distance evaluation:
    $$s_i = \frac{1}{(d_i + \epsilon)^p}$$
  - Prunes to top $K$ influences (default 4) and strictly normalizes $\sum w_{ij} = 1.0$.
- **Graph-Laplacian Weight Smoothing (`smoothWeightsLaplacian`)**:
  - Diffuses influence weights across adjacent triangle edges:
    $$w'_{v, b} = (1 - \alpha) w_{v, b} + \alpha \cdot \frac{1}{|N(v)|} \sum_{u \in N(v)} w_{u, b}$$
  - Preserves partition of unity $\sum w = 1.0$.

### 2. Studio Web Worker via Comlink (`apps/compatibility-lab/src/mesh-worker.ts`)

- Offloads heavy grid meshing and Laplacian weight solving to a background Web Worker thread.
- Exposes typed RPC methods using `comlink`.

### 3. Compatibility Lab Integration (`apps/compatibility-lab`)

- Added live preview options:
  - **Canonical Weighted Mesh**: LBS skinning evaluation and wireframe rendering.
  - **Auto-Mesh Worker (BBW/Laplacian)**: Live background computation of mesh topology and weights rendered directly onto the Pixi canvas.

## Verification

- Unit test suite: [`tests/unit/authoring.test.ts`](../../tests/unit/authoring.test.ts) covering triangulation, point-to-segment math, auto-weights, and Laplacian smoothing.
- Browser test suite: [`tests/browser/preview.spec.ts`](../../tests/browser/preview.spec.ts) covering canvas rendering of weighted meshes and worker-generated meshes.
