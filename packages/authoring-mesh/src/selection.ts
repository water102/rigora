import RBush from "rbush";
import type { Vec2 } from "@rigora/math";
import type { AuthoringMesh } from "./authoring.js";

export type MeshSelectionPriority = "vertex" | "edge" | "face" | "boundary";

interface BoundsItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  kind: MeshSelectionPriority;
  index: number;
  point: Vec2;
}

function bounds(points: readonly Vec2[]): BoundsItem {
  const first = points[0]!;
  return {
    minX: Math.min(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxX: Math.max(...points.map((p) => p.x)),
    maxY: Math.max(...points.map((p) => p.y)),
    kind: "vertex",
    index: 0,
    point: first,
  };
}

function inside(point: Vec2, polygon: readonly Vec2[]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!,
      b = polygon[j]!;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      hit = !hit;
  }
  return hit;
}

function addItem(
  tree: RBush<BoundsItem>,
  kind: MeshSelectionPriority,
  index: number,
  point: Vec2,
  extent: Vec2[] = [point],
) {
  const item = bounds(extent);
  tree.insert({ ...item, kind, index, point });
}

/** Selects mesh primitives using an RBush coarse query followed by exact tests. */
export function selectMeshByPolygon(
  mesh: AuthoringMesh,
  polygon: readonly Vec2[],
  priority: MeshSelectionPriority = "vertex",
): number[] {
  if (polygon.length < 3) return [];
  const tree = new RBush<BoundsItem>();
  const order: MeshSelectionPriority[] =
    priority === "boundary"
      ? ["boundary", "edge", "vertex", "face"]
      : [priority];
  mesh.vertices.forEach((vertex, index) =>
    addItem(tree, "vertex", index, vertex.position),
  );
  mesh.edges.forEach(([a, b], index) => {
    const start = mesh.vertices[a]!.position;
    const end = mesh.vertices[b]!.position;
    addItem(
      tree,
      "edge",
      index,
      {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
      [start, end],
    );
  });
  for (let i = 0; i < mesh.triangles.length; i += 3) {
    const points = mesh.triangles
      .slice(i, i + 3)
      .map((index) => mesh.vertices[index]!.position);
    addItem(
      tree,
      "face",
      i / 3,
      {
        x: points.reduce((sum, point) => sum + point.x, 0) / 3,
        y: points.reduce((sum, point) => sum + point.y, 0) / 3,
      },
      points,
    );
  }
  const query = bounds(polygon);
  const hits = tree.search(query).filter((item) => inside(item.point, polygon));
  const result: number[] = [];
  for (const kind of order) {
    for (const item of hits.filter((candidate) => candidate.kind === kind)) {
      if (!result.includes(item.index)) result.push(item.index);
    }
  }
  return result.sort((a, b) => a - b);
}
