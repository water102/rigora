import type { Vec2 } from "@rigora/math";
import type { WeightedVertex, WeightedInfluence } from "@rigora/model";

export interface BoneSegment {
  id: string;
  start: Vec2;
  end: Vec2;
}

/**
 * Distance from point P to line segment AB.
 */
export function pointToSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const wx = p.x - a.x;
  const wy = p.y - a.y;

  const c1 = wx * vx + wy * vy;
  if (c1 <= 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) {
    return Math.hypot(p.x - b.x, p.y - b.y);
  }

  const t = c1 / c2;
  const projX = a.x + t * vx;
  const projY = a.y + t * vy;
  return Math.hypot(p.x - projX, p.y - projY);
}

export interface AutoWeightOptions {
  /** Distance falloff power, default 2.0 */
  power?: number;
  /** Small epsilon to avoid divide-by-zero, default 1e-4 */
  epsilon?: number;
  /** Maximum number of bone influences per vertex, default 4 */
  maxInfluences?: number;
  /** Minimum weight threshold to retain influence, default 0.01 */
  minThreshold?: number;
}

/**
 * Compute auto-weights for vertices based on distance to bone segments (Spec 28 Part J).
 * Retains top maxInfluences and normalizes so sum of weights is 1.0.
 */
export function computeAutoWeights(
  vertices: readonly Vec2[],
  bones: readonly BoneSegment[],
  options: AutoWeightOptions = {},
): WeightedVertex[] {
  if (!bones.length) {
    throw new Error("AUTO_WEIGHTS_NO_BONES: At least one bone is required.");
  }

  const p = options.power ?? 2;
  const eps = options.epsilon ?? 1e-4;
  const maxInfluences = options.maxInfluences ?? 4;
  const minThreshold = options.minThreshold ?? 0.01;

  return vertices.map((vertex) => {
    // Score each bone by distance
    const scored: { boneId: string; score: number }[] = [];
    for (const bone of bones) {
      const dist = pointToSegmentDistance(vertex, bone.start, bone.end);
      const score = 1 / Math.pow(dist + eps, p);
      scored.push({ boneId: bone.id, score });
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Keep top maxInfluences
    const top = scored.slice(0, maxInfluences);
    const sumScore = top.reduce((acc, item) => acc + item.score, 0);

    // Normalize
    let influences: WeightedInfluence[] = top.map((item) => ({
      boneId: item.boneId,
      weight: item.score / sumScore,
    }));

    // Filter below min threshold if there are multiple influences
    if (influences.length > 1) {
      influences = influences.filter((inf) => inf.weight >= minThreshold);
      const reSum = influences.reduce((acc, inf) => acc + inf.weight, 0);
      for (const inf of influences) {
        inf.weight /= reSum;
      }
    }

    return {
      bindPosition: { x: vertex.x, y: vertex.y },
      influences,
    };
  });
}

/**
 * Laplacian smoothing pass on weights (Spec 28 Part I).
 * Smooths weight transitions across mesh edges:
 * w'_new = (1 - alpha) * w + alpha * avg(neighbor_weights)
 */
export function smoothWeightsLaplacian(
  weightedVertices: readonly WeightedVertex[],
  triangles: readonly number[],
  alpha = 0.5,
  iterations = 1,
): WeightedVertex[] {
  if (alpha <= 0 || iterations < 1) return [...weightedVertices];

  // Build adjacency graph from triangles
  const N = weightedVertices.length;
  const neighbors: Set<number>[] = Array.from({ length: N }, () => new Set());
  for (let t = 0; t < triangles.length; t += 3) {
    const i0 = triangles[t]!;
    const i1 = triangles[t + 1]!;
    const i2 = triangles[t + 2]!;
    neighbors[i0]!.add(i1).add(i2);
    neighbors[i1]!.add(i0).add(i2);
    neighbors[i2]!.add(i0).add(i1);
  }

  // Find unique bone IDs
  const boneIds = new Set<string>();
  for (const v of weightedVertices) {
    for (const inf of v.influences) {
      boneIds.add(inf.boneId);
    }
  }
  const allBones = Array.from(boneIds);

  // Dense matrix for iteration: N x B
  let currentWeights = new Float64Array(N * allBones.length);
  const boneIndexMap = new Map(allBones.map((id, idx) => [id, idx]));

  for (let i = 0; i < N; i++) {
    for (const inf of weightedVertices[i]!.influences) {
      const bIdx = boneIndexMap.get(inf.boneId)!;
      currentWeights[i * allBones.length + bIdx] = inf.weight;
    }
  }

  const B = allBones.length;
  for (let iter = 0; iter < iterations; iter++) {
    const nextWeights = new Float64Array(N * B);
    for (let i = 0; i < N; i++) {
      const adj = Array.from(neighbors[i]!);
      if (!adj.length) {
        for (let b = 0; b < B; b++) {
          nextWeights[i * B + b] = currentWeights[i * B + b]!;
        }
        continue;
      }
      let rowSum = 0;
      for (let b = 0; b < B; b++) {
        let neighborAvg = 0;
        for (const n of adj) {
          neighborAvg += currentWeights[n * B + b]!;
        }
        neighborAvg /= adj.length;

        const w =
          (1 - alpha) * currentWeights[i * B + b]! + alpha * neighborAvg;
        nextWeights[i * B + b] = w;
        rowSum += w;
      }
      // Re-normalize row
      if (rowSum > 0) {
        for (let b = 0; b < B; b++) {
          const idx = i * B + b;
          nextWeights[idx] = nextWeights[idx]! / rowSum;
        }
      }
    }
    currentWeights = nextWeights;
  }

  // Re-encode into WeightedVertex format
  return weightedVertices.map((orig, i) => {
    const influences: WeightedInfluence[] = [];
    for (let b = 0; b < B; b++) {
      const w = currentWeights[i * B + b]!;
      if (w > 0.005) {
        influences.push({ boneId: allBones[b]!, weight: w });
      }
    }
    // Normalize after pruning tiny weights
    const sum = influences.reduce((s, inf) => s + inf.weight, 0);
    if (sum > 0) {
      for (const inf of influences) inf.weight /= sum;
    }
    return {
      bindPosition: { ...orig.bindPosition },
      influences,
    };
  });
}
