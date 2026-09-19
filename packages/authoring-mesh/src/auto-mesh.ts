import type { Vec2 } from "@rigora/math";
import { triangulatePolygon, type TriangulatedMesh } from "./triangulation.js";

export interface AlphaImage {
  width: number;
  height: number;
  rgba: Uint8Array | readonly number[];
}
export interface AutoMeshOptions {
  threshold?: number;
  simplify?: number;
  padding?: number;
  density?: number;
}
export interface AutoMeshPreview {
  originalContour: Vec2[];
  contour: Vec2[];
  mesh: TriangulatedMesh;
}

function alpha(image: AlphaImage, x: number, y: number): number {
  return image.rgba[(y * image.width + x) * 4 + 3] ?? 0;
}
function distanceToLine(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const n = Math.hypot(dx, dy) || 1;
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / n;
}
export function simplifyContour(
  points: readonly Vec2[],
  epsilon: number,
): Vec2[] {
  if (points.length < 3 || epsilon <= 0) return points.map((p) => ({ ...p }));
  const keep = new Set([0, points.length - 1]);
  const visit = (start: number, end: number): void => {
    let best = 0,
      index = -1;
    for (let i = start + 1; i < end; i++) {
      const d = distanceToLine(points[i]!, points[start]!, points[end]!);
      if (d > best) {
        best = d;
        index = i;
      }
    }
    if (index >= 0 && best > epsilon) {
      keep.add(index);
      visit(start, index);
      visit(index, end);
    }
  };
  visit(0, points.length - 1);
  return [...keep].sort((a, b) => a - b).map((i) => ({ ...points[i]! }));
}
export function extractAlphaContour(
  image: AlphaImage,
  threshold = 128,
): Vec2[] {
  const points: Vec2[] = [];
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++)
      if (
        alpha(image, x, y) >= threshold &&
        (x === 0 ||
          y === 0 ||
          x === image.width - 1 ||
          y === image.height - 1 ||
          alpha(image, x - 1, y) < threshold ||
          alpha(image, x + 1, y) < threshold ||
          alpha(image, x, y - 1) < threshold ||
          alpha(image, x, y + 1) < threshold)
      )
        points.push({ x, y });
  if (points.length < 3) throw new Error("AUTO_MESH_EMPTY_CONTOUR");
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length,
    cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return points.sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
  );
}
export function buildAutoMeshPreview(
  image: AlphaImage,
  options: AutoMeshOptions = {},
): AutoMeshPreview {
  const originalContour = extractAlphaContour(image, options.threshold ?? 128);
  const contour = simplifyContour(originalContour, options.simplify ?? 1);
  if (options.padding) {
    const cx = contour.reduce((s, p) => s + p.x, 0) / contour.length,
      cy = contour.reduce((s, p) => s + p.y, 0) / contour.length;
    for (const p of contour) {
      const dx = p.x - cx,
        dy = p.y - cy,
        n = Math.hypot(dx, dy) || 1;
      p.x += (dx / n) * options.padding;
      p.y += (dy / n) * options.padding;
    }
  }
  return { originalContour, contour, mesh: triangulatePolygon(contour) };
}

export interface AutoMeshJob {
  type: "preview";
  image: AlphaImage;
  options?: AutoMeshOptions;
}
export type AutoMeshResult = { type: "preview"; preview: AutoMeshPreview };
export function runAutoMeshJob(job: AutoMeshJob): AutoMeshResult {
  return {
    type: "preview",
    preview: buildAutoMeshPreview(job.image, job.options),
  };
}
