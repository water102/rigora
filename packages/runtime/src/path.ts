import { transformPoint, type Mat2D, type Vec2 } from "@rigora/math";
import type { AttachmentData, WeightedVertex } from "@rigora/model";
import type { RuntimeBoneState } from "./constraints.js";

export type PathAttachmentData = Extract<AttachmentData, { type: "path" }>;

export interface CubicSegment {
  p0: Vec2;
  p1: Vec2;
  p2: Vec2;
  p3: Vec2;
}

export interface ArcSample {
  segmentIndex: number;
  t: number; // local t in [0, 1]
  distance: number; // cumulative distance from start
}

export interface CompiledPath {
  closed: boolean;
  constantSpeed: boolean;
  segments: CubicSegment[];
  arcTable: ArcSample[];
  totalLength: number;
}

export interface PathSampleResult {
  x: number;
  y: number;
  tangentAngle: number;
  distance: number;
}

/**
 * Evaluates a point on a cubic Bezier curve at parameter t in [0, 1].
 */
export function evalCubicBezier(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  t: number,
): Vec2 {
  const oneMinusT = 1 - t;
  const c0 = oneMinusT * oneMinusT * oneMinusT;
  const c1 = 3 * oneMinusT * oneMinusT * t;
  const c2 = 3 * oneMinusT * t * t;
  const c3 = t * t * t;

  return {
    x: c0 * p0.x + c1 * p1.x + c2 * p2.x + c3 * p3.x,
    y: c0 * p0.y + c1 * p1.y + c2 * p2.y + c3 * p3.y,
  };
}

/**
 * Evaluates the first derivative of a cubic Bezier curve at parameter t.
 * B'(t) = 3(1-t)^2 (p1 - p0) + 6(1-t)t (p2 - p1) + 3t^2 (p3 - p2)
 */
export function evalCubicDerivative(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  t: number,
): Vec2 {
  const oneMinusT = 1 - t;
  const d0 = 3 * oneMinusT * oneMinusT;
  const d1 = 6 * oneMinusT * t;
  const d2 = 3 * t * t;

  const dx = d0 * (p1.x - p0.x) + d1 * (p2.x - p1.x) + d2 * (p3.x - p2.x);
  const dy = d0 * (p1.y - p0.y) + d1 * (p2.y - p1.y) + d2 * (p3.y - p2.y);

  return { x: dx, y: dy };
}

/**
 * Converts a sequence of 2D control points into cubic Bezier segments.
 * Points layout: Anchor 0, Out-handle 0, In-handle 1, Anchor 1, etc.
 */
export function compilePathSegments(
  points: Vec2[],
  closed: boolean,
): CubicSegment[] {
  const segments: CubicSegment[] = [];
  const n = points.length;
  if (n < 2) return segments;

  if (n === 2) {
    // 2 points form a single linear segment
    const p0 = points[0]!;
    const p3 = points[1]!;
    segments.push({
      p0,
      p1: { x: p0.x + (p3.x - p0.x) / 3, y: p0.y + (p3.y - p0.y) / 3 },
      p2: {
        x: p0.x + ((p3.x - p0.x) * 2) / 3,
        y: p0.y + ((p3.y - p0.y) * 2) / 3,
      },
      p3,
    });
    return segments;
  }

  let i = 0;
  while (i + 3 < n) {
    segments.push({
      p0: points[i]!,
      p1: points[i + 1]!,
      p2: points[i + 2]!,
      p3: points[i + 3]!,
    });
    i += 3;
  }

  // If closed loop and there are remaining points connecting back to points[0]
  if (closed && i < n) {
    const p0 = points[i]!;
    const p1 = i + 1 < n ? points[i + 1]! : p0;
    const p2 = i + 2 < n ? points[i + 2]! : points[0]!;
    const p3 = points[0]!;
    segments.push({ p0, p1, p2, p3 });
  }

  return segments;
}

/**
 * Builds an arc-length lookup table (LUT) for precise distance-to-t mapping.
 */
export function buildArcLengthTable(
  segments: CubicSegment[],
  samplesPerSegment: number = 32,
): { arcTable: ArcSample[]; totalLength: number } {
  const arcTable: ArcSample[] = [];
  let totalLength = 0;

  if (segments.length === 0) {
    return { arcTable, totalLength: 0 };
  }

  arcTable.push({ segmentIndex: 0, t: 0, distance: 0 });

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx]!;
    let prevPoint = seg.p0;

    for (let step = 1; step <= samplesPerSegment; step++) {
      const t = step / samplesPerSegment;
      const pt = evalCubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, t);
      const stepDist = Math.hypot(pt.x - prevPoint.x, pt.y - prevPoint.y);
      totalLength += stepDist;
      arcTable.push({
        segmentIndex: sIdx,
        t,
        distance: totalLength,
      });
      prevPoint = pt;
    }
  }

  return { arcTable, totalLength };
}

/**
 * Compiles a raw path into a compiled path with arc-length LUT.
 */
export function compilePath(
  points: Vec2[],
  closed: boolean,
  constantSpeed: boolean = true,
): CompiledPath {
  const segments = compilePathSegments(points, closed);
  const { arcTable, totalLength } = buildArcLengthTable(segments);

  return {
    closed,
    constantSpeed,
    segments,
    arcTable,
    totalLength,
  };
}

/**
 * Samples a compiled path at a specified distance along its length.
 */
export function samplePathAtDistance(
  path: CompiledPath,
  requestedDist: number,
): PathSampleResult {
  const { segments, arcTable, totalLength, closed, constantSpeed } = path;

  if (segments.length === 0 || totalLength <= 1e-6) {
    const defaultPoint = segments[0]?.p0 ?? { x: 0, y: 0 };
    return {
      x: defaultPoint.x,
      y: defaultPoint.y,
      tangentAngle: 0,
      distance: 0,
    };
  }

  let dist = requestedDist;
  if (closed) {
    dist = ((dist % totalLength) + totalLength) % totalLength;
  } else {
    dist = Math.max(0, Math.min(totalLength, dist));
  }

  if (!constantSpeed) {
    // Parameter-speed mode: distribute across segments uniformly
    const totalSegments = segments.length;
    const progress = totalLength > 0 ? dist / totalLength : 0;
    const scaled = progress * totalSegments;
    const segIdx = Math.min(Math.floor(scaled), totalSegments - 1);
    const t = Math.max(0, Math.min(1, scaled - segIdx));

    const seg = segments[segIdx]!;
    const pt = evalCubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, t);
    let deriv = evalCubicDerivative(seg.p0, seg.p1, seg.p2, seg.p3, t);
    if (Math.hypot(deriv.x, deriv.y) < 1e-6) {
      deriv = { x: seg.p3.x - seg.p0.x, y: seg.p3.y - seg.p0.y };
    }
    const tangentAngle = Math.atan2(deriv.y, deriv.x);
    return { x: pt.x, y: pt.y, tangentAngle, distance: dist };
  }

  // Binary search arcTable for the bracket [i, i+1] containing dist
  let low = 0;
  let high = arcTable.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (arcTable[mid]!.distance <= dist) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const idx = Math.max(0, Math.min(arcTable.length - 2, high));
  const s0 = arcTable[idx]!;
  const s1 = arcTable[idx + 1]!;

  const span = s1.distance - s0.distance;
  const ratio = span > 1e-6 ? (dist - s0.distance) / span : 0;
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  // Determine segment index and local t
  const segIdx = s0.segmentIndex;
  const seg = segments[segIdx]!;
  const t = s0.t + (s1.t - s0.t) * clampedRatio;

  const pt = evalCubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, t);
  let deriv = evalCubicDerivative(seg.p0, seg.p1, seg.p2, seg.p3, t);
  if (Math.hypot(deriv.x, deriv.y) < 1e-6) {
    deriv = { x: seg.p3.x - seg.p0.x, y: seg.p3.y - seg.p0.y };
  }
  const tangentAngle = Math.atan2(deriv.y, deriv.x);

  return { x: pt.x, y: pt.y, tangentAngle, distance: dist };
}

/**
 * Evaluates world-space 2D control points for a path attachment,
 * supporting both unweighted local vertices and Linear Blend Skinning (LBS).
 */
export function evaluatePathAttachmentWorldPoints(
  attachment: PathAttachmentData,
  slotBoneWorld: Mat2D,
  bonesById: Map<string, RuntimeBoneState>,
): Vec2[] {
  const raw = attachment.vertices;
  if (!Array.isArray(raw) || raw.length === 0) return [];

  // Check if unweighted Vec2[] or WeightedVertex[]
  const first = raw[0];
  if (first && "x" in first && "y" in first && typeof first.x === "number") {
    // Unweighted Vec2[] - transform each point by slot bone's world transform
    const unweighted = raw as Vec2[];
    return unweighted.map((pt) => transformPoint(slotBoneWorld, pt));
  }

  // WeightedVertex[] - Linear Blend Skinning
  const weighted = raw as WeightedVertex[];
  return weighted.map((wv) => {
    let wx = 0;
    let wy = 0;
    for (const inf of wv.influences) {
      const bone = bonesById.get(inf.boneId);
      const boneWorld = bone ? bone.world : slotBoneWorld;
      const pt = transformPoint(
        boneWorld,
        inf.localPosition ?? wv.bindPosition,
      );
      wx += pt.x * inf.weight;
      wy += pt.y * inf.weight;
    }
    return { x: wx, y: wy };
  });
}
