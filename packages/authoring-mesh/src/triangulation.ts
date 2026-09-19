import earcut from "earcut";
import Delaunator from "delaunator";
import type { Vec2 } from "@rigora/math";

export interface TriangulatedMesh {
  vertices: Vec2[];
  uvs: Vec2[];
  triangles: number[];
}

/**
 * Triangulate a 2D polygon ring with optional holes using earcut.
 * Automatically computes normalized UV coordinates in [0, 1] relative to the bounding box.
 */
export function triangulatePolygon(
  ring: readonly Vec2[],
  holes: readonly (readonly Vec2[])[] = [],
): TriangulatedMesh {
  if (ring.length < 3) {
    throw new Error(
      "TRIANGULATION_TOO_FEW_VERTICES: Ring must have at least 3 vertices.",
    );
  }

  // Find bounding box for UV mapping
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of ring) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;

  const flatCoords: number[] = [];
  const holeIndices: number[] = [];
  const allVertices: Vec2[] = [];

  for (const p of ring) {
    flatCoords.push(p.x, p.y);
    allVertices.push({ x: p.x, y: p.y });
  }

  for (const hole of holes) {
    holeIndices.push(allVertices.length);
    for (const p of hole) {
      flatCoords.push(p.x, p.y);
      allVertices.push({ x: p.x, y: p.y });
    }
  }

  const indices = earcut(
    flatCoords,
    holeIndices.length ? holeIndices : undefined,
    2,
  );

  const uvs: Vec2[] = allVertices.map((v) => ({
    x: (v.x - minX) / width,
    y: (v.y - minY) / height,
  }));

  return {
    vertices: allVertices,
    uvs,
    triangles: indices,
  };
}

/**
 * Generate a regular grid mesh (e.g. for cloth, deformable surfaces, or testing).
 * cols and rows are segment counts (e.g. cols=2, rows=2 -> 3x3 vertices = 9 vertices, 8 triangles).
 */
export function generateGridMesh(
  width: number,
  height: number,
  cols: number,
  rows: number,
  originX = 0,
  originY = 0,
): TriangulatedMesh {
  if (cols < 1 || rows < 1) {
    throw new Error(
      "GRID_INVALID_SUBDIVISIONS: cols and rows must be at least 1.",
    );
  }

  const vertices: Vec2[] = [];
  const uvs: Vec2[] = [];
  const triangles: number[] = [];

  const dx = width / cols;
  const dy = height / rows;

  for (let r = 0; r <= rows; r++) {
    const y = originY + r * dy;
    const v = r / rows;
    for (let c = 0; c <= cols; c++) {
      const x = originX + c * dx;
      const u = c / cols;
      vertices.push({ x, y });
      uvs.push({ x: u, y: v });
    }
  }

  const rowStride = cols + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v0 = r * rowStride + c;
      const v1 = v0 + 1;
      const v2 = (r + 1) * rowStride + c;
      const v3 = v2 + 1;

      // Two triangles per cell: (v0, v1, v2) and (v1, v3, v2)
      triangles.push(v0, v1, v2);
      triangles.push(v1, v3, v2);
    }
  }

  return { vertices, uvs, triangles };
}

/**
 * Triangulate an unorganized set of points via Delaunay triangulation.
 */
export function triangulatePoints(points: readonly Vec2[]): TriangulatedMesh {
  if (points.length < 3) {
    throw new Error(
      "DELAUNAY_TOO_FEW_POINTS: Point set must contain at least 3 points.",
    );
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const coords: number[] = [];
  for (const p of points) {
    coords.push(p.x, p.y);
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;

  const delaunay = new Delaunator(coords);
  const triangles = Array.from(delaunay.triangles);

  const uvs = points.map((p) => ({
    x: (p.x - minX) / width,
    y: (p.y - minY) / height,
  }));

  return {
    vertices: points.map((p) => ({ x: p.x, y: p.y })),
    uvs,
    triangles,
  };
}
