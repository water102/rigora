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

export {
  buildAutoMeshPreview,
  extractAlphaContour,
  runAutoMeshJob,
  simplifyContour,
  type AlphaImage,
  type AutoMeshJob,
  type AutoMeshOptions,
  type AutoMeshPreview,
  type AutoMeshResult,
} from "./auto-mesh.js";
