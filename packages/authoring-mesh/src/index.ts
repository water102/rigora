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
  applyBrushAtPoint,
  applyWeightDeltas,
  createWeightDeltaCommand,
  addEdge,
  bindVertices,
  connectedSelection,
  createAuthoringMesh,
  createEditablePath,
  deleteVertex,
  meshEdges,
  moveVertex,
  removeEdge,
  resetTopology,
  invertSelection,
  lassoSelection,
  pointInPolygon,
  pathTangents,
  selectPolygon,
  unbindVertices,
  updatePathPoint,
  weightHeatmap,
  type AuthoringMesh,
  type EditablePath,
  type MeshMode,
  type WeightDelta,
  type SparseDeltaCommand,
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

export {
  createDeformState,
  inheritLinkedDeform,
  keyDeform,
  sampleDeform,
  setDeformMode,
  setDeformOffset,
  zeroDeform,
  type DeformAuthoringMode,
  type DeformState,
} from "./deform.js";

export {
  createAuthoringDocument,
  parseAuthoringDocument,
  persistMesh,
  persistPath,
  serializeAuthoringDocument,
  type AuthoringDocument,
} from "./persistence.js";
