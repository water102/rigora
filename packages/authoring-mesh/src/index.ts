export { TopologyHistory } from "./topology-history.js";

export {
  selectMeshByPolygon,
  type MeshSelectionPriority,
} from "./selection.js";

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
  createAttachmentFromLibrary,
  type AttachmentCreateOptions,
  type AuthoringAttachmentKind,
  type LibraryAsset,
} from "./attachments.js";

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
  retriangulate,
  invertSelection,
  lassoSelection,
  pointInPolygon,
  pathTangents,
  pathConstraintPreview,
  selectPolygon,
  unbindVertices,
  updatePathPoint,
  weightHeatmap,
  listInfluences,
  limitInfluences,
  smoothWeightRows,
  type AuthoringMesh,
  type EditablePath,
  type MeshMode,
  type WeightDelta,
  type SparseDeltaCommand,
  type InfluenceEntry,
  type PathConstraintPreviewPoint,
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

export {
  applyVertexDrag,
  beginDrag,
  cancelDrag,
  endDrag,
  updateDrag,
  type DragMode,
  type DragSession,
} from "./interaction.js";
