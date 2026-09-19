import type { Vec2 } from "@rigora/math";

export interface AuthoringMesh {
  vertices: Array<{ id: string; position: Vec2 }>;
  triangles: number[];
}
export type MeshMode = "vertex" | "edge" | "face" | "boundary";

export function createAuthoringMesh(
  points: readonly Vec2[],
  triangles: readonly number[] = [],
): AuthoringMesh {
  return {
    vertices: points.map((position, i) => ({
      id: `v${i}`,
      position: { ...position },
    })),
    triangles: [...triangles],
  };
}
export function moveVertex(
  mesh: AuthoringMesh,
  id: string,
  position: Vec2,
): AuthoringMesh {
  if (!mesh.vertices.some((v) => v.id === id))
    throw new Error("MESH_VERTEX_NOT_FOUND");
  return {
    vertices: mesh.vertices.map((v) =>
      v.id === id
        ? { ...v, position: { ...position } }
        : { ...v, position: { ...v.position } },
    ),
    triangles: [...mesh.triangles],
  };
}
export function deleteVertex(mesh: AuthoringMesh, id: string): AuthoringMesh {
  const index = mesh.vertices.findIndex((v) => v.id === id);
  if (index < 0) throw new Error("MESH_VERTEX_NOT_FOUND");
  const vertices = mesh.vertices.filter((v) => v.id !== id);
  const triangles: number[] = [];
  for (let i = 0; i < mesh.triangles.length; i += 3) {
    const tri = mesh.triangles.slice(i, i + 3);
    if (tri.includes(index)) continue;
    triangles.push(...tri.map((n) => (n > index ? n - 1 : n)));
  }
  return {
    vertices: vertices.map((v) => ({ ...v, position: { ...v.position } })),
    triangles,
  };
}
export function meshEdges(mesh: AuthoringMesh): Array<[number, number]> {
  const edges = new Map<string, [number, number]>();
  for (let i = 0; i < mesh.triangles.length; i += 3)
    for (const [a, b] of [
      [mesh.triangles[i]!, mesh.triangles[i + 1]!],
      [mesh.triangles[i + 1]!, mesh.triangles[i + 2]!],
      [mesh.triangles[i + 2]!, mesh.triangles[i]!],
    ] as Array<[number, number]>) {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (!edges.has(key)) edges.set(key, a < b ? [a, b] : [b, a]);
    }
  return [...edges.values()];
}

export interface WeightDelta {
  vertexId: string;
  boneId: string;
  before: number;
  after: number;
}
export function applyWeightBrush(
  weights: Record<string, Record<string, number>>,
  vertexIds: readonly string[],
  boneId: string,
  mode: "add" | "subtract" | "replace" | "erase" | "smooth",
  strength: number,
  locked: ReadonlySet<string> = new Set(),
): WeightDelta[] {
  const amount = Math.max(0, Math.min(1, strength));
  const deltas: WeightDelta[] = [];
  for (const vertexId of vertexIds) {
    const row = weights[vertexId] ?? (weights[vertexId] = {});
    const before = row[boneId] ?? 0;
    if (locked.has(boneId)) continue;
    const after =
      mode === "add"
        ? before + amount
        : mode === "subtract"
          ? before - amount
          : mode === "erase"
            ? 0
            : mode === "replace"
              ? amount
              : before;
    row[boneId] = Math.max(0, Math.min(1, after));
    const sum = Object.values(row).reduce((a, b) => a + b, 0);
    if (sum > 0) for (const key of Object.keys(row)) row[key]! /= sum;
    if (before !== row[boneId])
      deltas.push({ vertexId, boneId, before, after: row[boneId]! });
  }
  return deltas;
}
export function applyWeightDeltas(
  weights: Record<string, Record<string, number>>,
  deltas: readonly WeightDelta[],
  direction: "undo" | "redo",
): void {
  for (const d of deltas)
    (weights[d.vertexId] ??= {})[d.boneId] =
      direction === "undo" ? d.before : d.after;
}

export function selectPolygon(
  points: readonly Vec2[],
  polygon: readonly Vec2[],
): number[] {
  return points
    .map((p, i) => [i, pointInPolygon(p, polygon)] as const)
    .filter(([, hit]) => hit)
    .map(([i]) => i);
}
export function pointInPolygon(point: Vec2, polygon: readonly Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!,
      b = polygon[j]!;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

export interface EditablePath {
  points: Vec2[];
  closed: boolean;
}
export function createEditablePath(
  points: readonly Vec2[] = [],
  closed = false,
): EditablePath {
  return { points: points.map((p) => ({ ...p })), closed };
}
export function updatePathPoint(
  path: EditablePath,
  index: number,
  position: Vec2,
): EditablePath {
  if (index < 0 || index >= path.points.length)
    throw new Error("PATH_POINT_NOT_FOUND");
  return {
    closed: path.closed,
    points: path.points.map((p, i) =>
      i === index ? { ...position } : { ...p },
    ),
  };
}
