export type Id = string;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

export interface Vec2 { x: number; y: number; }
export interface Rgb { r: number; g: number; b: number; }
export interface Rgba extends Rgb { a: number; }

export interface Transform2D {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  shearX: number;
  shearY: number;
}

export type TransformInheritance =
  | "normal"
  | "onlyTranslation"
  | "noRotationOrReflection"
  | "noScale"
  | "noScaleOrReflection"
  | "customPreserved";

export interface BoneData {
  id: Id;
  name: string;
  parentId?: Id;
  setup: Transform2D;
  length: number;
  inherit: TransformInheritance;
}

export interface SlotData {
  id: Id;
  name: string;
  boneId: Id;
  setupAttachmentId?: Id;
  color: Rgba;
  darkColor?: Rgb;
  blendMode: "normal" | "additive" | "multiply" | "screen";
  zIndex: number;
}

export type CurveSpec =
  | { type: "linear" }
  | { type: "stepped" }
  | { type: "bezier"; cx1: number; cy1: number; cx2: number; cy2: number };

export interface Keyframe<T> {
  time: number;
  value: T;
  curve: CurveSpec;
}

export interface WeightedInfluence {
  boneId: Id;
  weight: number;
  localPosition?: Vec2;
}

export interface WeightedVertex {
  bindPosition: Vec2;
  influences: WeightedInfluence[];
}

export interface RegionAttachment {
  type: "region";
  id: Id;
  name: string;
  textureId: Id;
  transform: Transform2D;
  width: number;
  height: number;
}

export interface MeshAttachment {
  type: "mesh";
  id: Id;
  name: string;
  textureId?: Id;
  vertices: Vec2[];
  weightedVertices?: WeightedVertex[];
  uvs: Vec2[];
  triangles: number[];
  hullLength?: number;
  linkedMeshId?: Id;
  inheritDeform?: boolean;
}

export interface ClippingAttachment {
  type: "clipping";
  id: Id;
  name: string;
  vertices: Vec2[];
  endSlotId?: Id;
}

export interface BoundingBoxAttachment {
  type: "boundingBox";
  id: Id;
  name: string;
  vertices: Vec2[];
}

export interface PathAttachment {
  type: "path";
  id: Id;
  name: string;
  closed: boolean;
  constantSpeed: boolean;
  vertices: Vec2[] | WeightedVertex[];
  lengths?: number[];
}

export interface PointAttachment {
  type: "point";
  id: Id;
  name: string;
  transform: Transform2D;
}

export interface UnknownPreservedAttachment {
  type: "unknownPreserved";
  id: Id;
  name: string;
  sourceFormat: string;
  payload: JsonValue;
}

export type AttachmentData =
  | RegionAttachment
  | MeshAttachment
  | ClippingAttachment
  | BoundingBoxAttachment
  | PathAttachment
  | PointAttachment
  | UnknownPreservedAttachment;

export interface SkinData {
  id: Id;
  name: string;
  attachments: Record<Id, AttachmentData[]>;
  requiredBoneIds?: Id[];
  requiredConstraintIds?: Id[];
}

export interface ConstraintBase {
  id: Id;
  name: string;
  order: number;
}

export interface IkConstraintData extends ConstraintBase {
  type: "ik";
  targetBoneId: Id;
  boneIds: Id[];
  mix: number;
  bendDirection: 1 | -1;
  softness?: number;
  compress?: boolean;
  stretch?: boolean;
}

export interface TransformConstraintData extends ConstraintBase {
  type: "transform";
  targetBoneId: Id;
  boneIds: Id[];
  mixRotate: number;
  mixTranslateX: number;
  mixTranslateY: number;
  mixScaleX: number;
  mixScaleY: number;
  mixShearY: number;
  local: boolean;
  relative: boolean;
}

export interface PathConstraintData extends ConstraintBase {
  type: "path";
  targetSlotId: Id;
  boneIds: Id[];
  positionMode: string;
  spacingMode: string;
  rotateMode: string;
  position: number;
  spacing: number;
  mixRotate: number;
  mixX: number;
  mixY: number;
}

export interface PhysicsConstraintData extends ConstraintBase {
  type: "physics";
  boneId: Id;
  inertia?: number;
  strength?: number;
  damping?: number;
  massInverse?: number;
  wind?: number;
  gravity?: number;
  mix?: number;
  sourceExtensions?: JsonValue;
}

export type ConstraintData =
  | IkConstraintData
  | TransformConstraintData
  | PathConstraintData
  | PhysicsConstraintData;

export interface TimelineData {
  id: Id;
  type: string;
  targetId?: Id;
  keyframes: Keyframe<JsonValue>[];
  metadata?: Record<string, JsonValue>;
}

export interface AnimationData {
  id: Id;
  name: string;
  duration: number;
  timelines: TimelineData[];
}

export interface SourceProvenance {
  format: "spine" | "dragonbones" | "hnn";
  version?: string;
  originalFile?: string;
  importMode: "strict" | "compatible" | "repair";
  warnings: string[];
  sourceHash?: string;
}

export interface SkeletonData {
  id: Id;
  name: string;
  source?: SourceProvenance;
  fps: number;
  bones: BoneData[];
  slots: SlotData[];
  skins: SkinData[];
  constraints: ConstraintData[];
  animations: AnimationData[];
  metadata?: Record<string, JsonValue>;
}
