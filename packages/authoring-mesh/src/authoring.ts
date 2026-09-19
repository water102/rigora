import type { Vec2 } from "@rigora/math";

export interface AuthoringMesh {
  vertices: Array<{ id: string; position: Vec2 }>;
  triangles: number[];
  edges: Array<[number, number]>;
}
export type MeshMode = "vertex" | "edge" | "face" | "boundary";

export function createAuthoringMesh(
  points: readonly Vec2[],
  triangles: readonly number[] = [],
): AuthoringMesh {
  const edges = new Map<string, [number, number]>();
  for (let i = 0; i < triangles.length; i += 3) {
    for (const [a, b] of [
      [triangles[i]!, triangles[i + 1]!],
      [triangles[i + 1]!, triangles[i + 2]!],
      [triangles[i + 2]!, triangles[i]!],
    ] as Array<[number, number]>) {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (!edges.has(key)) edges.set(key, a < b ? [a, b] : [b, a]);
    }
  }
  return {
    vertices: points.map((position, i) => ({
      id: `v${i}`,
      position: { ...position },
    })),
    triangles: [...triangles],
    edges: [...edges.values()],
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
    edges: mesh.edges.map(([a, b]) => [a, b]),
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
  const edges = mesh.edges
    .filter(([a, b]) => a !== index && b !== index)
    .map(
      ([a, b]) =>
        [a > index ? a - 1 : a, b > index ? b - 1 : b] as [number, number],
    );
  return {
    vertices: vertices.map((v) => ({ ...v, position: { ...v.position } })),
    triangles,
    edges,
  };
}
export function meshEdges(mesh: AuthoringMesh): Array<[number, number]> {
  return mesh.edges.map(([a, b]) => [a, b]);
}
export function addEdge(
  mesh: AuthoringMesh,
  a: number,
  b: number,
): AuthoringMesh {
  if (
    a === b ||
    a < 0 ||
    b < 0 ||
    a >= mesh.vertices.length ||
    b >= mesh.vertices.length
  )
    throw new Error("MESH_EDGE_INVALID");
  const edges = meshEdges(mesh);
  if (!edges.some(([x, y]) => x === Math.min(a, b) && y === Math.max(a, b)))
    edges.push(a < b ? [a, b] : [b, a]);
  return {
    vertices: mesh.vertices.map((v) => ({ ...v, position: { ...v.position } })),
    triangles: [...mesh.triangles],
    edges,
  };
}
export function removeEdge(
  mesh: AuthoringMesh,
  a: number,
  b: number,
): AuthoringMesh {
  const edges = meshEdges(mesh).filter(
    ([x, y]) => !(x === Math.min(a, b) && y === Math.max(a, b)),
  );
  return {
    vertices: mesh.vertices.map((v) => ({ ...v, position: { ...v.position } })),
    triangles: [...mesh.triangles],
    edges,
  };
}
export function resetTopology(mesh: AuthoringMesh): AuthoringMesh {
  return {
    vertices: mesh.vertices.map((v) => ({ ...v, position: { ...v.position } })),
    triangles: [],
    edges: [],
  };
}

export interface WeightDelta {
  vertexId: string;
  boneId: string;
  before: number;
  after: number;
}
export interface SparseDeltaCommand {
  id: string;
  label: string;
  execute(): void;
  undo(): void;
}
export function createWeightDeltaCommand(
  weights: Record<string, Record<string, number>>,
  deltas: readonly WeightDelta[],
  label = "Weight stroke",
): SparseDeltaCommand {
  return {
    id: `weight-delta-${deltas.length}-${label}`,
    label,
    execute: () => applyWeightDeltas(weights, deltas, "redo"),
    undo: () => applyWeightDeltas(weights, deltas, "undo"),
  };
}

export function bindVertices(
  weights: Record<string, Record<string, number>>,
  vertexIds: readonly string[],
  boneId: string,
): WeightDelta[] {
  const deltas: WeightDelta[] = [];
  for (const id of vertexIds) {
    const row = (weights[id] ??= {});
    const before = row[boneId] ?? 0;
    row[boneId] = 1;
    for (const key of Object.keys(row)) if (key !== boneId) row[key] = 0;
    if (before !== 1) deltas.push({ vertexId: id, boneId, before, after: 1 });
  }
  return deltas;
}
export function unbindVertices(
  weights: Record<string, Record<string, number>>,
  vertexIds: readonly string[],
  boneId: string,
): WeightDelta[] {
  const deltas: WeightDelta[] = [];
  for (const id of vertexIds) {
    const row = weights[id];
    if (!row || row[boneId] === undefined) continue;
    const before = row[boneId]!;
    delete row[boneId];
    const sum = Object.values(row).reduce((a, b) => a + b, 0);
    if (sum > 0) for (const key of Object.keys(row)) row[key]! /= sum;
    deltas.push({ vertexId: id, boneId, before, after: 0 });
  }
  return deltas;
}
export function weightHeatmap(
  weights: Record<string, Record<string, number>>,
  vertexIds: readonly string[],
  boneId: string,
): number[] {
  return vertexIds.map((id) =>
    Math.max(0, Math.min(1, weights[id]?.[boneId] ?? 0)),
  );
}
export interface InfluenceEntry {
  boneId: string;
  weight: number;
  locked: boolean;
}
export function listInfluences(
  weights: Record<string, Record<string, number>>,
  vertexId: string,
  locked: ReadonlySet<string> = new Set(),
): InfluenceEntry[] {
  return Object.entries(weights[vertexId] ?? {})
    .map(([boneId, weight]) => ({ boneId, weight, locked: locked.has(boneId) }))
    .sort((a, b) => b.weight - a.weight || a.boneId.localeCompare(b.boneId));
}
export function limitInfluences(
  weights: Record<string, Record<string, number>>,
  vertexIds: readonly string[],
  maxInfluences: number,
  locked: ReadonlySet<string> = new Set(),
): void {
  if (!Number.isInteger(maxInfluences) || maxInfluences < 1)
    throw new Error("WEIGHTS_INVALID_MAX_INFLUENCES");
  for (const vertexId of vertexIds) {
    const row = weights[vertexId];
    if (!row) continue;
    const entries = Object.entries(row).sort(
      ([a, aw], [b, bw]) => bw - aw || a.localeCompare(b),
    );
    const retained = entries.filter(([boneId]) => locked.has(boneId));
    if (retained.length > maxInfluences)
      throw new Error("WEIGHTS_TOO_MANY_LOCKED_INFLUENCES");
    for (const entry of entries) {
      if (retained.length >= maxInfluences) break;
      if (!retained.some(([boneId]) => boneId === entry[0]))
        retained.push(entry);
    }
    const keep = new Set(retained.map(([boneId]) => boneId));
    for (const boneId of Object.keys(row))
      if (!keep.has(boneId)) delete row[boneId];
    const sum = Object.values(row).reduce((total, weight) => total + weight, 0);
    if (sum > 0) for (const boneId of Object.keys(row)) row[boneId]! /= sum;
  }
}
export function smoothWeightRows(
  weights: Record<string, Record<string, number>>,
  vertexIds: readonly string[],
  neighbors: Readonly<Record<string, readonly string[]>>,
  strength: number,
  locked: ReadonlySet<string> = new Set(),
): WeightDelta[] {
  const amount = Math.max(0, Math.min(1, strength));
  const before = new Map(
    vertexIds.map((id) => [id, { ...(weights[id] ?? {}) }]),
  );
  const deltas: WeightDelta[] = [];
  for (const vertexId of vertexIds) {
    const row = (weights[vertexId] ??= {});
    const adjacent = (neighbors[vertexId] ?? []).map(
      (id) => before.get(id) ?? weights[id] ?? {},
    );
    if (!adjacent.length) continue;
    const bones = new Set([
      ...Object.keys(before.get(vertexId) ?? {}),
      ...adjacent.flatMap((neighbor) => Object.keys(neighbor)),
    ]);
    for (const boneId of bones) {
      if (locked.has(boneId)) continue;
      const old = row[boneId] ?? 0;
      const average =
        adjacent.reduce((sum, neighbor) => sum + (neighbor[boneId] ?? 0), 0) /
        adjacent.length;
      const next = old + (average - old) * amount;
      if (next > 0) row[boneId] = next;
      else delete row[boneId];
    }
    const sum = Object.values(row).reduce((total, value) => total + value, 0);
    if (sum > 0) for (const boneId of Object.keys(row)) row[boneId]! /= sum;
  }
  for (const vertexId of vertexIds) {
    const old = before.get(vertexId) ?? {};
    const next = weights[vertexId] ?? {};
    for (const boneId of new Set([...Object.keys(old), ...Object.keys(next)])) {
      const beforeWeight = old[boneId] ?? 0;
      const afterWeight = next[boneId] ?? 0;
      if (beforeWeight !== afterWeight)
        deltas.push({
          vertexId,
          boneId,
          before: beforeWeight,
          after: afterWeight,
        });
    }
  }
  return deltas;
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
export interface BrushOptions {
  radius: number;
  strength: number;
  falloff?: "linear" | "smoothstep" | "gaussian";
  mode: "add" | "subtract" | "replace" | "erase" | "smooth";
}
export function applyBrushAtPoint(
  weights: Record<string, Record<string, number>>,
  vertices: readonly { id: string; position: Vec2 }[],
  center: Vec2,
  boneId: string,
  options: BrushOptions,
): WeightDelta[] {
  if (!(options.radius > 0)) throw new Error("BRUSH_INVALID_RADIUS");
  const selected = vertices
    .filter(
      (v) =>
        Math.hypot(v.position.x - center.x, v.position.y - center.y) <=
        options.radius,
    )
    .map((v) => v.id);
  const scaled: WeightDelta[] = [];
  for (const id of selected) {
    const p = vertices.find((v) => v.id === id)!.position;
    const u = Math.min(
      1,
      Math.hypot(p.x - center.x, p.y - center.y) / options.radius,
    );
    const falloff =
      options.falloff === "gaussian"
        ? Math.exp(-4 * u * u)
        : options.falloff === "smoothstep" || !options.falloff
          ? 1 - u * u * (3 - 2 * u)
          : 1 - u;
    scaled.push(
      ...applyWeightBrush(
        weights,
        [id],
        boneId,
        options.mode,
        options.strength * falloff,
      ),
    );
  }
  return scaled;
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
export function invertSelection(
  count: number,
  selected: readonly number[],
): number[] {
  const set = new Set(selected);
  return Array.from({ length: count }, (_, i) => i).filter((i) => !set.has(i));
}
export function connectedSelection(
  mesh: AuthoringMesh,
  seed: number,
): number[] {
  const seen = new Set([seed]);
  let changed = true;
  const edges = meshEdges(mesh);
  while (changed) {
    changed = false;
    for (const [a, b] of edges)
      if (seen.has(a) || seen.has(b)) {
        if (!seen.has(a)) {
          seen.add(a);
          changed = true;
        }
        if (!seen.has(b)) {
          seen.add(b);
          changed = true;
        }
      }
  }
  return [...seen].sort((a, b) => a - b);
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
export function lassoSelection(
  vertices: readonly { id: string; position: Vec2 }[],
  polygon: readonly Vec2[],
): string[] {
  return vertices
    .filter((v) => pointInPolygon(v.position, polygon))
    .map((v) => v.id);
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
export function pathTangents(path: EditablePath): Vec2[] {
  return path.points.map((p, i) => {
    const prev =
      path.points[(i - 1 + path.points.length) % path.points.length] ?? p;
    const next = path.points[(i + 1) % path.points.length] ?? p;
    if (!path.closed && i === 0) return { x: next.x - p.x, y: next.y - p.y };
    if (!path.closed && i === path.points.length - 1)
      return { x: p.x - prev.x, y: p.y - prev.y };
    return { x: (next.x - prev.x) / 2, y: (next.y - prev.y) / 2 };
  });
}
export interface PathConstraintPreviewPoint {
  position: Vec2;
  tangent: Vec2;
  t: number;
}
/** Sample a polyline path for a constraint preview without mutating the path. */
export function pathConstraintPreview(
  path: EditablePath,
  sampleCount = 16,
): PathConstraintPreviewPoint[] {
  if (!Number.isInteger(sampleCount) || sampleCount < 2)
    throw new Error("PATH_INVALID_SAMPLE_COUNT");
  if (!path.points.length) return [];
  const tangents = pathTangents(path);
  const last = path.closed ? path.points.length : path.points.length - 1;
  return Array.from({ length: sampleCount }, (_, index) => {
    const t = index / (sampleCount - 1);
    const scaled = t * last;
    const left = Math.min(Math.floor(scaled), path.points.length - 1);
    const next = path.closed
      ? (left + 1) % path.points.length
      : Math.min(left + 1, path.points.length - 1);
    const amount = scaled - Math.floor(scaled);
    const a = path.points[left]!;
    const b = path.points[next]!;
    const tangent = tangents[left]!;
    const length = Math.hypot(tangent.x, tangent.y);
    return {
      t,
      position: {
        x: a.x + (b.x - a.x) * amount,
        y: a.y + (b.y - a.y) * amount,
      },
      tangent:
        length > 0
          ? { x: tangent.x / length, y: tangent.y / length }
          : { x: 0, y: 0 },
    };
  });
}
