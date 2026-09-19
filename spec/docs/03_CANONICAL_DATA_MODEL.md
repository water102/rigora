# 03 — Canonical Data Model

## 1. Goals

The model must be:
- expressive enough to represent DragonBones 5.5, Spine 3.8 and Spine 4.2 subsets;
- serializable;
- deterministic;
- renderer agnostic;
- editor friendly;
- versionable;
- explicit about unsupported/lossy constructs.

## 2. Root project

```ts
interface HnnProject {
  format: "hnn-bones";
  formatVersion: string;
  metadata: ProjectMetadata;
  assets: AssetLibrary;
  skeletons: SkeletonData[];
  editor?: EditorMetadata;
}
```

## 3. Skeleton

```ts
interface SkeletonData {
  id: Id;
  name: string;
  source?: SourceProvenance;
  coordinateSystem: CoordinateSystem;
  fps: number;
  bones: BoneData[];
  slots: SlotData[];
  skins: SkinData[];
  constraints: ConstraintData[];
  animations: AnimationData[];
  events: EventDefinition[];
  bounds?: Rect;
  metadata?: Record<string, JsonValue>;
}
```

## 4. Bone

```ts
interface BoneData {
  id: Id;
  name: string;
  parentId?: Id;
  setup: Transform2D;
  length: number;
  inherit: TransformInheritance;
  color?: Rgba;
  tags?: string[];
}
```

Never use names as canonical references. Importers resolve external names to stable IDs.

## 5. Transform

```ts
interface Transform2D {
  x: number;
  y: number;
  rotation: number; // canonical radians
  scaleX: number;
  scaleY: number;
  shearX: number;   // canonical radians
  shearY: number;
}
```

Canonical storage SHALL use radians internally even if editor displays degrees.

## 6. Slots

```ts
interface SlotData {
  id: Id;
  name: string;
  boneId: Id;
  setupAttachmentId?: Id;
  color: Rgba;
  darkColor?: Rgb;
  blendMode: BlendMode;
  zIndex: number;
}
```

## 7. Attachments

Discriminated union:

```ts
type AttachmentData =
  | RegionAttachment
  | MeshAttachment
  | ClippingAttachment
  | BoundingBoxAttachment
  | PathAttachment
  | PointAttachment
  | NestedSkeletonAttachment
  | UnknownPreservedAttachment;
```

### Region
- texture region reference
- local transform
- width/height
- pivot
- sequence metadata if supported

### Mesh
- positions
- UVs
- triangle indices
- hull/boundary
- bone weights
- optional linked/shared mesh reference
- deform inheritance policy

### Weighted vertex

```ts
interface WeightedVertex {
  bindPosition: Vec2;
  influences: {
    boneId: Id;
    weight: number;
    localPosition?: Vec2;
  }[];
}
```

Invariant: normalized influence sum is approximately 1.0 after canonical normalization.

## 8. Skins

```ts
interface SkinData {
  id: Id;
  name: string;
  attachments: Record<SlotId, AttachmentData[]>;
  requiredBoneIds?: Id[];
  requiredConstraintIds?: Id[];
}
```

## 9. Constraints

```ts
type ConstraintData =
  | IkConstraintData
  | TransformConstraintData
  | PathConstraintData
  | PhysicsConstraintData
  | UnknownPreservedConstraint;
```

Each constraint includes:
- stable id
- name
- order
- enabled/setup flags
- target references
- mix values

## 10. Animation

```ts
interface AnimationData {
  id: Id;
  name: string;
  duration: number;
  timelines: TimelineData[];
}
```

Timeline discriminants SHALL include at least:
- bone.translate
- bone.rotate
- bone.scale
- bone.shear
- slot.color
- slot.twoColor
- slot.attachment
- deform
- drawOrder
- event
- ik.mix
- transform.mix
- path.position
- path.spacing
- path.mix
- physics.*
- custom/unknown-preserved

## 11. Keyframes

```ts
interface Keyframe<T> {
  time: number; // seconds
  value: T;
  curve: CurveSpec;
}
type CurveSpec =
  | { type: "linear" }
  | { type: "stepped" }
  | { type: "bezier"; cx1: number; cy1: number; cx2: number; cy2: number };
```

## 12. Provenance

Every imported project SHOULD retain:

```ts
interface SourceProvenance {
  format: "spine" | "dragonbones" | "hnn";
  version?: string;
  originalFile?: string;
  importMode: "strict" | "compatible" | "repair";
  warnings: string[];
}
```

This is essential for exact-version export decisions.

## 13. Unknown preservation

When possible, unknown non-rendering fields SHOULD be retained in extension bags rather than discarded.

Unknown behavior-bearing fields MUST raise diagnostics.

## 14. Referential integrity

Validation errors:
- missing parent bone
- duplicate stable ID
- missing slot bone
- missing attachment target
- cyclic bone hierarchy
- cyclic linked mesh
- invalid index buffer
- invalid weight bone
- non-finite numeric values
- invalid time order

## 15. Stable IDs

Native projects use UUID/ULID-like IDs.
External format names are resolved on import and regenerated on export.
Rename operations therefore do not break internal references.
