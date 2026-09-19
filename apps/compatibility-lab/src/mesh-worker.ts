import * as Comlink from "comlink";
import {
  generateGridMesh,
  computeAutoWeights,
  smoothWeightsLaplacian,
  runAutoMeshJob,
  type AlphaImage,
  type AutoMeshOptions,
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
  previewAutoWeights(
    vertices: readonly Vec2[],
    bones: readonly BoneSegment[],
    power?: number,
    maxInfluences?: number,
  ): ReturnType<typeof computeAutoWeights>;
  generateGridMeshAndWeights(
    width: number,
    height: number,
    cols: number,
    rows: number,
    bones: readonly BoneSegment[],
    smoothIterations?: number,
  ): MeshWorkerResult;
  previewAutoMesh(
    image: AlphaImage,
    options?: AutoMeshOptions,
  ): ReturnType<typeof runAutoMeshJob>;
}

const api: MeshWorkerApi = {
  previewAutoWeights(vertices, bones, power, maxInfluences) {
    return computeAutoWeights(vertices, bones, {
      ...(power === undefined ? {} : { power }),
      ...(maxInfluences === undefined ? {} : { maxInfluences }),
    });
  },
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
  previewAutoMesh(image, options) {
    return runAutoMeshJob(
      options
        ? { type: "preview", image, options }
        : { type: "preview", image },
    );
  },
};

Comlink.expose(api);
