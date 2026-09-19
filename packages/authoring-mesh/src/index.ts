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
  createAuthoringMesh,
  createEditablePath,
  deleteVertex,
  meshEdges,
  moveVertex,
  pointInPolygon,
  selectPolygon,
  updatePathPoint,
  type AuthoringMesh,
  type EditablePath,
  type MeshMode,
  type WeightDelta,
} from "./authoring.js";
