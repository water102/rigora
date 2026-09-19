import { describe, expect, it } from "vitest";
import {
  applyWeightBrush,
  createAuthoringDocument,
  applyBrushAtPoint,
  applyWeightDeltas,
  createWeightDeltaCommand,
  addEdge,
  buildAutoMeshPreview,
  createDeformState,
  inheritLinkedDeform,
  keyDeform,
  pathTangents,
  sampleDeform,
  setDeformOffset,
  zeroDeform,
  createAuthoringMesh,
  createEditablePath,
  parseAuthoringDocument,
  persistMesh,
  serializeAuthoringDocument,
  deleteVertex,
  meshEdges,
  moveVertex,
  lassoSelection,
  removeEdge,
  resetTopology,
  selectPolygon,
  updatePathPoint,
  triangulatePolygon,
  generateGridMesh,
  triangulatePoints,
  pointToSegmentDistance,
  computeAutoWeights,
  smoothWeightsLaplacian,
} from "../../packages/authoring-mesh/src/index.js";

describe("Phase 6 authoring core", () => {
  it("builds deterministic auto-mesh previews from alpha", () => {
    const rgba = new Uint8Array(16 * 4);
    for (const i of [5, 6, 9, 10]) rgba[i * 4 + 3] = 255;
    const preview = buildAutoMeshPreview(
      { width: 4, height: 4, rgba },
      { threshold: 128, simplify: 0 },
    );
    expect(preview.originalContour.length).toBeGreaterThanOrEqual(3);
    expect(preview.mesh.triangles.length).toBeGreaterThan(0);
  });
  it("preserves stable topology operations and adjacency", () => {
    const original = createAuthoringMesh(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      [0, 1, 2],
    );
    const moved = moveVertex(original, "v1", { x: 2, y: 0 });
    expect(moved.vertices[1]!.id).toBe("v1");
    expect(meshEdges(moved)).toHaveLength(3);
    expect(deleteVertex(moved, "v0").triangles).toEqual([]);
    expect(resetTopology(moved).triangles).toEqual([]);
    expect(
      removeEdge(addEdge(resetTopology(moved), 0, 1), 0, 1).triangles,
    ).toEqual([]);
  });

  it("supports setup/animation deform authoring and linked inheritance", () => {
    let state = createDeformState(1);
    state = setDeformOffset(state, 0, { x: 2, y: 0 });
    state = keyDeform(state, 0);
    state = setDeformOffset(state, 0, { x: 4, y: 0 });
    state = keyDeform(state, 1);
    expect(sampleDeform(state, 0.5)[0]).toBe(3);
    expect(zeroDeform(state).offsets).toEqual([0, 0]);
    expect(inheritLinkedDeform([1, 2], [3, 4], true)).toEqual([1, 2]);
  });

  it("supports lasso selection and distance falloff brush strokes", () => {
    const vertices = [
      { id: "v0", position: { x: 0, y: 0 } },
      { id: "v1", position: { x: 2, y: 0 } },
      { id: "v2", position: { x: 5, y: 0 } },
    ];
    expect(
      lassoSelection(vertices, [
        { x: -1, y: -1 },
        { x: 3, y: -1 },
        { x: 3, y: 1 },
        { x: -1, y: 1 },
      ]),
    ).toEqual(["v0", "v1"]);
    const weights = Object.fromEntries(
      vertices.map((v) => [v.id, { boneA: 1 }]),
    );
    const deltas = applyBrushAtPoint(
      weights,
      vertices,
      { x: 0, y: 0 },
      "boneB",
      { radius: 3, strength: 1, mode: "add", falloff: "linear" },
    );
    expect(deltas.length).toBe(2);
    expect(weights.v0!.boneB).toBeGreaterThan(weights.v1!.boneB!);
    const command = createWeightDeltaCommand(weights, deltas);
    command.undo();
    expect(weights.v0!.boneB).toBe(0);
    command.execute();
    expect(weights.v0!.boneB).toBeGreaterThan(0);
  });

  it("round-trips authoring state for project persistence", () => {
    const mesh = createAuthoringMesh(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      [0, 1, 2],
    );
    const saved = persistMesh(createAuthoringDocument(), mesh);
    const loaded = parseAuthoringDocument(serializeAuthoringDocument(saved));
    expect(loaded.version).toBe(1);
    expect(loaded.meshes[0]!.vertices[1]!.id).toBe("v1");
    expect(() => parseAuthoringDocument("{}" as string)).toThrow(
      "AUTHORING_STATE_UNSUPPORTED_VERSION",
    );
  });

  it("computes path tangent previews", () => {
    expect(
      pathTangents(
        createEditablePath([
          { x: 0, y: 0 },
          { x: 2, y: 0 },
        ]),
      )[0],
    ).toEqual({ x: 2, y: 0 });
  });

  it("returns sparse reversible brush deltas and supports polygon/path editing", () => {
    const weights = { v0: { boneA: 1 } };
    const deltas = applyWeightBrush(weights, ["v0"], "boneB", "add", 0.5);
    expect(weights.v0.boneB).toBeCloseTo(1 / 3);
    applyWeightDeltas(weights, deltas, "undo");
    expect(weights.v0.boneB).toBe(0);
    expect(
      selectPolygon(
        [
          { x: 0.5, y: 0.5 },
          { x: 2, y: 2 },
        ],
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
      ),
    ).toEqual([0]);
    const path = updatePathPoint(createEditablePath([{ x: 0, y: 0 }]), 0, {
      x: 2,
      y: 3,
    });
    expect(path.points[0]).toEqual({ x: 2, y: 3 });
  });
});

describe("Triangulation Engine", () => {
  it("triangulates simple rectangle polygon into 2 triangles with [0, 1] UVs", () => {
    const ring = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ];
    const mesh = triangulatePolygon(ring);
    expect(mesh.vertices).toHaveLength(4);
    expect(mesh.triangles).toHaveLength(6); // 2 triangles
    expect(mesh.uvs[0]).toEqual({ x: 0, y: 0 });
    expect(mesh.uvs[1]).toEqual({ x: 1, y: 0 });
    expect(mesh.uvs[2]).toEqual({ x: 1, y: 1 });
    expect(mesh.uvs[3]).toEqual({ x: 0, y: 1 });
  });

  it("rejects polygon rings with fewer than 3 vertices", () => {
    expect(() =>
      triangulatePolygon([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]),
    ).toThrow("TRIANGULATION_TOO_FEW_VERTICES");
  });

  it("generates regular grid mesh with correct vertex count and indices", () => {
    // 2 columns, 2 rows -> 3x3 vertices = 9 vertices, 2*2*2 = 8 triangles = 24 indices
    const grid = generateGridMesh(100, 50, 2, 2);
    expect(grid.vertices).toHaveLength(9);
    expect(grid.triangles).toHaveLength(24);
    expect(grid.uvs[0]).toEqual({ x: 0, y: 0 });
    expect(grid.uvs[8]).toEqual({ x: 1, y: 1 });
  });

  it("triangulates unordered point set via Delaunay", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 10 },
      { x: 5, y: 5 },
    ];
    const mesh = triangulatePoints(points);
    expect(mesh.vertices).toHaveLength(4);
    expect(mesh.triangles.length).toBeGreaterThanOrEqual(3);
    expect(mesh.triangles.length % 3).toBe(0);
  });
});

describe("Auto-Weighting Engine", () => {
  it("calculates point-to-segment distance correctly", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };

    // Point exactly on segment
    expect(pointToSegmentDistance({ x: 5, y: 0 }, a, b)).toBe(0);

    // Point perpendicular to segment
    expect(pointToSegmentDistance({ x: 5, y: 4 }, a, b)).toBe(4);

    // Point before segment start
    expect(pointToSegmentDistance({ x: -3, y: 4 }, a, b)).toBe(5);

    // Point after segment end
    expect(pointToSegmentDistance({ x: 13, y: 4 }, a, b)).toBe(5);
  });

  it("computes inverse distance auto-weights with sum normalized to 1.0", () => {
    const bones = [
      { id: "root", start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
      { id: "tip", start: { x: 10, y: 0 }, end: { x: 20, y: 0 } },
    ];

    const vertices = [
      { x: 2, y: 1 }, // Very close to root
      { x: 18, y: 1 }, // Very close to tip
      { x: 10, y: 5 }, // Equidistant to both
    ];

    const weights = computeAutoWeights(vertices, bones);
    expect(weights).toHaveLength(3);

    // Check vertex 0 (close to root)
    const v0Root = weights[0]!.influences.find((i) => i.boneId === "root");
    const v0Tip = weights[0]!.influences.find((i) => i.boneId === "tip");
    expect(v0Root).toBeDefined();
    expect(v0Root!.weight).toBeGreaterThan(0.9);
    if (v0Tip) expect(v0Tip.weight).toBeLessThan(0.1);

    // Check sum of weights equals 1
    for (const v of weights) {
      const sum = v.influences.reduce((acc, i) => acc + i.weight, 0);
      expect(sum).toBeCloseTo(1.0);
    }

    // Check vertex 2 (equidistant)
    const v2Root = weights[2]!.influences.find((i) => i.boneId === "root")!;
    const v2Tip = weights[2]!.influences.find((i) => i.boneId === "tip")!;
    expect(v2Root.weight).toBeCloseTo(0.5, 1);
    expect(v2Tip.weight).toBeCloseTo(0.5, 1);
  });

  it("smooths weights across triangle topology using Laplacian smoothing", () => {
    // 3 vertices forming a triangle
    // v0 has 100% bone-1, v1 has 100% bone-2, v2 has 100% bone-2
    const weightedVertices = [
      {
        bindPosition: { x: 0, y: 0 },
        influences: [{ boneId: "bone-1", weight: 1.0 }],
      },
      {
        bindPosition: { x: 10, y: 0 },
        influences: [{ boneId: "bone-2", weight: 1.0 }],
      },
      {
        bindPosition: { x: 5, y: 10 },
        influences: [{ boneId: "bone-2", weight: 1.0 }],
      },
    ];
    const triangles = [0, 1, 2];

    const smoothed = smoothWeightsLaplacian(
      weightedVertices,
      triangles,
      0.5,
      1,
    );
    expect(smoothed).toHaveLength(3);

    // v0 should now have some influence from bone-2
    const v0Bone2 = smoothed[0]!.influences.find((i) => i.boneId === "bone-2");
    expect(v0Bone2).toBeDefined();
    expect(v0Bone2!.weight).toBeGreaterThan(0.2);

    // Total weights should still sum to 1.0
    for (const v of smoothed) {
      const sum = v.influences.reduce((acc, i) => acc + i.weight, 0);
      expect(sum).toBeCloseTo(1.0);
    }
  });
});
