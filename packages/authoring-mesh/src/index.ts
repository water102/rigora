export {
  triangulatePolygon,
  generateGridMesh,
  triangulatePoints,
  type TriangulatedMesh,
} from "./triangulation.js";

export {
  pointToSegmentDistance,
  computeAutoWeights,
  smoothWeightsLaplacian,
  type BoneSegment,
  type AutoWeightOptions,
} from "./weights.js";

export {
  applyWeightBrush,
  applyWeightDeltas,
  bindVertices,
  connectedSelection,
  createAuthoringMesh,
  createEditablePath,
  deleteVertex,
  meshEdges,
  moveVertex,
  invertSelection,
  pointInPolygon,
  selectPolygon,
  unbindVertices,
  updatePathPoint,
  weightHeatmap,
  type AuthoringMesh,
  type EditablePath,
  type MeshMode,
  type WeightDelta,
} from "./authoring.js";
