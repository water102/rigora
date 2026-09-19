# 28 — Mesh, Geometry, Contour and Weight Algorithms

## 1. Goals

Mesh tools must be robust enough for artist workflows without turning HNN into a computational geometry research project.

Prefer proven geometry libraries and keep our custom logic focused on authoring semantics.

---

# Part A — Polygon representation

Canonical editor polygon:
- ordered outer ring;
- optional holes;
- explicit vertex IDs;
- optional user-locked edges.

Validate before triangulation:
- duplicate points;
- zero-length edges;
- self intersection;
- hole containment;
- winding consistency.

Earcut is fast and practical but does not guarantee correctness for arbitrary malformed polygons; therefore sanitation belongs before triangulation.

---

# Part B — Triangulation

## Default: Earcut

Use for:
- valid boundary polygon;
- holes;
- rapid re-triangulation during editing.

After triangulation:
- run area/deviation sanity check where library support exists;
- reject zero-area triangles;
- preserve boundary edges.

## Optional refinement: Delaunay

Use Delaunator or Delaunay refinement for:
- automatically generated internal points;
- improved triangle quality;
- avoiding extremely skinny triangles.

Do not use unconstrained Delaunay alone when boundary preservation is mandatory.

---

# Part C — Alpha contour extraction

Auto-mesh pipeline:

```text
RGBA image
 -> alpha mask
 -> optional blur/threshold
 -> marching squares contour
 -> contour cleanup
 -> RDP simplification
 -> optional offset/padding
 -> triangulation
```

Marching Squares complexity: O(width × height).

Threshold must be an explicit user/project parameter.

---

# Part D — Ramer–Douglas–Peucker simplification

Input: ordered contour points.

Algorithm:
1. line from first to last;
2. find point with maximum perpendicular distance;
3. if distance > epsilon, recursively simplify both sides;
4. else keep endpoints.

Use to reduce noisy alpha contours.

Avoid excessive epsilon that changes silhouette.

Store:
- simplification tolerance in image pixels;
- preview original vs simplified contour.

---

# Part E — Mesh editing topology

Maintain:
- vertices with stable IDs;
- triangle index list;
- adjacency graph;
- boundary flags.

Rebuild adjacency after topology mutation.

Adjacency supports:
- smoothing;
- connected selection;
- weight smoothing;
- edge operations.

---

# Part F — Hit testing

### Vertices
Use RBush bounding boxes around screen/world points.

### Edges
Candidate query from RBush, then exact point-to-segment distance.

### Faces
Bounding-box candidate, then barycentric/half-plane point-in-triangle test.

Screen-space pick radius should remain visually stable as zoom changes.

---

# Part G — Weight painting

## Data

Each vertex has sparse influences.

## Brush

For vertex distance `d`, brush radius `R`, define normalized `u = clamp(d/R, 0, 1)`.

Falloff candidates:
- linear: `1-u`
- smoothstep
- Gaussian-like

Default: smoothstep because it is stable and intuitive.

Change:

```text
delta = strength × falloff(u) × pressure
```

Then:
1. update selected bone weight;
2. respect locked influences;
3. clamp;
4. normalize unlocked influences.

A whole pointer stroke = one command transaction.

---

# Part H — Weight normalization

For unlocked positive weights:

```text
sum = Σ w_i
if sum > epsilon:
  w_i /= sum
else:
  assign fallback influence deterministically
```

Locked weights:
1. compute locked sum;
2. remaining = 1 - locked sum;
3. normalize unlocked into remaining.

If locked sum > 1, diagnose and either reject or proportionally normalize locked values depending on tool mode.

---

# Part I — Weight smoothing

Graph-Laplacian style pass:

```text
w_new(v,bone) =
 (1-alpha)*w(v,bone)
 + alpha*average(w(neighbor,bone))
```

Then normalize.

Options:
- 1–N iterations;
- boundary preservation;
- locked vertices/bones.

This is editor tooling, not runtime.

---

# Part J — Auto weights V1

Use distance from vertex to bone segment, not only distance to bone origin.

For each vertex:
1. select nearby candidate bones;
2. compute point-to-segment distance `d_i`;
3. score `s_i = 1 / (d_i + epsilon)^p`;
4. optionally penalize bones separated by contour/geodesic barriers;
5. keep top N;
6. normalize.

Suggested `p`: 2 as starting point.

Advantages:
- simple;
- deterministic;
- fast;
- understandable fallback.

Limitations:
- can leak weights across nearby but disconnected limbs.

---

# Part K — Auto weights advanced

Later options:
- heat diffusion;
- harmonic coordinates;
- bounded biharmonic weights;
- voxel/geodesic barriers.

These require matrix solvers and more complex preprocessing. Run in worker/WASM if adopted.

Do not block V1 on advanced auto-weighting.

---

# Part L — Soft selection

For selected vertex set:
1. graph-distance or Euclidean-distance propagation;
2. falloff weight;
3. transform neighboring vertices proportionally.

Graph distance is preferable near folded/close geometry because it respects topology.

Use Dijkstra/BFS depending on edge weights.

---

# Part M — UV handling

Keep authoring vertex positions and UVs separate.

When atlas region rotates:
- resolve atlas transform in renderer/import adapter;
- do not mutate source UV topology unnecessarily.

Golden tests required for rotated atlas entries because historical converters frequently get this wrong.

---

# Part N — Complexity targets

- hit test: O(log N + candidates)
- triangulation: interactive for hundreds/thousands of vertices
- weight brush: O(local candidates × influences)
- smoothing: O(E × iterations)
- auto weights V1: O(V × candidate bones)

Move only heavy auto tools to workers.
