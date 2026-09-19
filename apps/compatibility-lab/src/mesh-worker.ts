import * as Comlink from "comlink";
import {
  generateGridMesh,
  computeAutoWeights,
  smoothWeightsLaplacian,
  type BoneSegment,
} from "@rigora/authoring-mesh";
import type { Vec2 } from "@rigora/math";
import type { WeightedVertex } from "@rigora/model";

export interface MeshWorkerResult {
  vertices: Vec2[];
  uvs: Vec2[];
  triangles: number[];
  weightedVertices: WeightedVertex[];
}

export interface MeshWorkerApi {
  generateGridMeshAndWeights(
    width: number,
    height: number,
    cols: number,
    rows: number,
    bones: readonly BoneSegment[],
    smoothIterations?: number,
  ): MeshWorkerResult;
}

const api: MeshWorkerApi = {
  generateGridMeshAndWeights(
    width,
    height,
    cols,
    rows,
    bones,
    smoothIterations = 1,
  ) {
    const mesh = generateGridMesh(
      width,
      height,
      cols,
      rows,
      -width / 2,
      -height / 2,
    );
    const initialWeights = computeAutoWeights(mesh.vertices, bones);
    const smoothedWeights = smoothWeightsLaplacian(
      initialWeights,
      mesh.triangles,
      0.5,
      smoothIterations,
    );
    return {
      vertices: mesh.vertices,
      uvs: mesh.uvs,
      triangles: mesh.triangles,
      weightedVertices: smoothedWeights,
    };
  },
};

Comlink.expose(api);
