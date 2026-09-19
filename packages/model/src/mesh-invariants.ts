import type { MeshAttachment } from "./schema.js";

export interface MeshIssue {
  code: string;
  message: string;
  path: string;
}
/** Requires schema-validated data. Never repairs or normalizes authored geometry. */
export function meshInvariants(mesh: MeshAttachment): MeshIssue[] {
  const issues: MeshIssue[] = [];
  const issue = (code: string, message: string, path: string) =>
    issues.push({ code, message, path });
  const vertices =
    mesh.weightedVertices?.map((vertex) => vertex.bindPosition) ??
    mesh.vertices;
  const count = vertices.length;
  if (
    mesh.weightedVertices &&
    mesh.vertices.length !== 0 &&
    mesh.vertices.length !== count
  )
    issue(
      "CORE_INVALID_MESH",
      "Optional authored vertices must match weighted vertex count.",
      "/vertices",
    );
  if (mesh.uvs.length !== count)
    issue("CORE_INVALID_MESH", "UV and vertex counts differ.", "/uvs");
  if (mesh.hullLength !== undefined && mesh.hullLength > count)
    issue("CORE_INVALID_MESH", "Hull exceeds vertex count.", "/hullLength");
  if (mesh.triangles.length % 3 !== 0)
    issue(
      "CORE_INVALID_TRIANGLES",
      "Triangle indices must occur in triples.",
      "/triangles",
    );
  for (let i = 0; i < mesh.triangles.length; i++) {
    if (mesh.triangles[i]! >= count)
      issue(
        "CORE_INVALID_TRIANGLES",
        "Vertex index is out of range.",
        `/triangles/${i}`,
      );
  }
  for (let i = 0; i + 2 < mesh.triangles.length; i += 3) {
    const ia = mesh.triangles[i]!,
      ib = mesh.triangles[i + 1]!,
      ic = mesh.triangles[i + 2]!;
    const a = vertices[ia],
      b = vertices[ib],
      c = vertices[ic];
    if (!a || !b || !c) continue;
    if (ia === ib || ib === ic || ia === ic) {
      issue(
        "CORE_DEGENERATE_TRIANGLE",
        "Triangle repeats a vertex index.",
        `/triangles/${i}`,
      );
      continue;
    }
    // Normalize coordinates first to avoid overflow with finite extremes.
    const coordinateScale = Math.max(
      Math.abs(a.x),
      Math.abs(a.y),
      Math.abs(b.x),
      Math.abs(b.y),
      Math.abs(c.x),
      Math.abs(c.y),
    );
    if (coordinateScale === 0) {
      issue(
        "CORE_DEGENERATE_TRIANGLE",
        "Triangle has zero area.",
        `/triangles/${i}`,
      );
      continue;
    }
    const x1 = b.x / coordinateScale - a.x / coordinateScale,
      y1 = b.y / coordinateScale - a.y / coordinateScale;
    const x2 = c.x / coordinateScale - a.x / coordinateScale,
      y2 = c.y / coordinateScale - a.y / coordinateScale;
    const edgeScale = Math.max(
      Math.abs(x1),
      Math.abs(y1),
      Math.abs(x2),
      Math.abs(y2),
    );
    const area =
      edgeScale === 0
        ? 0
        : Math.abs(
            (x1 / edgeScale) * (y2 / edgeScale) -
              (y1 / edgeScale) * (x2 / edgeScale),
          );
    if (area <= 1e-12)
      issue(
        "CORE_DEGENERATE_TRIANGLE",
        "Triangle is collinear or numerically degenerate.",
        `/triangles/${i}`,
      );
  }
  return issues;
}
