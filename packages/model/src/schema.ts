import { z } from "zod";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
const finite = z.number().finite();
const nonnegative = finite.nonnegative();
const id = z.string().min(1);
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    finite,
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);
const extensions = z.record(jsonValueSchema);
const vec = z.object({ x: finite, y: finite }).strict();
const rgb = z
  .object({
    r: finite.min(0).max(1),
    g: finite.min(0).max(1),
    b: finite.min(0).max(1),
  })
  .strict();
const rgba = rgb.extend({ a: finite.min(0).max(1) });
export const transformSchema = z
  .object({
    x: finite,
    y: finite,
    rotation: finite,
    scaleX: finite,
    scaleY: finite,
    shearX: finite,
    shearY: finite,
  })
  .strict();
const entity = z.object({ id, name: z.string() }).strict();
export const boneSchema = entity.extend({
  parentId: id.optional(),
  setup: transformSchema,
  length: nonnegative,
  inherit: z.enum([
    "normal",
    "onlyTranslation",
    "noRotationOrReflection",
    "noScale",
    "noScaleOrReflection",
    "customPreserved",
  ]),
  color: rgba.optional(),
  tags: z.array(z.string()).optional(),
});
export const slotSchema = entity.extend({
  boneId: id,
  setupAttachmentId: id.optional(),
  color: rgba,
  darkColor: rgb.optional(),
  blendMode: z.enum(["normal", "additive", "multiply", "screen"]),
  zIndex: finite,
});
export const weightedVertexSchema = z
  .object({
    bindPosition: vec,
    influences: z
      .array(
        z
          .object({
            boneId: id,
            weight: nonnegative,
            localPosition: vec.optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export const meshAttachmentSchema = entity.extend({
  type: z.literal("mesh"),
  textureId: id.optional(),
  vertices: z.array(vec),
  weightedVertices: z.array(weightedVertexSchema).optional(),
  uvs: z.array(vec),
  triangles: z.array(nonnegative.int().safe()),
  hullLength: nonnegative.int().safe().optional(),
  linkedMeshId: id.optional(),
  inheritDeform: z.boolean().optional(),
});
export type MeshAttachment = z.infer<typeof meshAttachmentSchema>;
export type WeightedVertex = z.infer<typeof weightedVertexSchema>;
export type WeightedInfluence = WeightedVertex["influences"][number];

export const attachmentSchema = z.discriminatedUnion("type", [
  entity.extend({
    type: z.literal("region"),
    textureId: id,
    transform: transformSchema,
    width: nonnegative,
    height: nonnegative,
    pivot: vec.optional(),
  }),
  meshAttachmentSchema,
  entity.extend({
    type: z.literal("clipping"),
    vertices: z.array(vec),
    endSlotId: id.optional(),
  }),
  entity.extend({ type: z.literal("boundingBox"), vertices: z.array(vec) }),
  entity.extend({
    type: z.literal("path"),
    closed: z.boolean(),
    constantSpeed: z.boolean(),
    vertices: z.union([z.array(vec), z.array(weightedVertexSchema)]),
    lengths: z.array(nonnegative).optional(),
  }),
  entity.extend({ type: z.literal("point"), transform: transformSchema }),
  entity.extend({
    type: z.literal("nestedSkeleton"),
    skeletonId: id,
    transform: transformSchema,
  }),
  entity.extend({
    type: z.literal("unknownPreserved"),
    sourceFormat: z.string(),
    payload: jsonValueSchema,
  }),
]);
const constraint = entity.extend({
  order: nonnegative.int(),
  enabled: z.boolean().optional(),
});
const mix = finite.min(0).max(1);
export const constraintSchema = z.discriminatedUnion("type", [
  constraint.extend({
    type: z.literal("ik"),
    targetBoneId: id,
    boneIds: z.array(id).min(1),
    mix,
    bendDirection: z.union([z.literal(1), z.literal(-1)]),
    softness: nonnegative.optional(),
    compress: z.boolean().optional(),
    stretch: z.boolean().optional(),
  }),
  constraint.extend({
    type: z.literal("transform"),
    targetBoneId: id,
    boneIds: z.array(id).min(1),
    mixRotate: mix,
    mixTranslateX: mix,
    mixTranslateY: mix,
    mixScaleX: mix,
    mixScaleY: mix,
    mixShearY: mix,
    local: z.boolean(),
    relative: z.boolean(),
  }),
  constraint.extend({
    type: z.literal("path"),
    targetSlotId: id,
    boneIds: z.array(id).min(1),
    positionMode: z.string(),
    spacingMode: z.string(),
    rotateMode: z.string(),
    position: finite,
    spacing: finite,
    mixRotate: mix,
    mixX: mix,
    mixY: mix,
  }),
  constraint.extend({
    type: z.literal("physics"),
    boneId: id,
    inertia: finite.optional(),
    strength: finite.optional(),
    damping: finite.optional(),
    massInverse: nonnegative.optional(),
    wind: finite.optional(),
    gravity: finite.optional(),
    mix: mix.optional(),
    sourceExtensions: jsonValueSchema.optional(),
  }),
  constraint.extend({
    type: z.literal("unknownPreserved"),
    sourceFormat: z.string(),
    payload: jsonValueSchema,
  }),
]);
export const curveSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("linear") }).strict(),
  z.object({ type: z.literal("stepped") }).strict(),
  z
    .object({
      type: z.literal("bezier"),
      cx1: mix,
      cy1: finite,
      cx2: mix,
      cy2: finite,
    })
    .strict(),
]);
export const timelineSchema = z
  .object({
    id,
    type: z.string().min(1),
    targetId: id.optional(),
    keyframes: z.array(
      z
        .object({
          time: nonnegative,
          value: jsonValueSchema,
          curve: curveSchema,
        })
        .strict(),
    ),
    metadata: extensions.optional(),
  })
  .strict();
export const animationSchema = entity.extend({
  duration: nonnegative,
  timelines: z.array(timelineSchema),
});
export const sourceProvenanceSchema = z
  .object({
    format: z.enum(["spine", "dragonbones", "hnn"]),
    version: z.string().optional(),
    originalFile: z.string().optional(),
    importMode: z.enum(["strict", "compatible", "repair"]),
    warnings: z.array(z.string()),
    sourceHash: z.string().optional(),
  })
  .strict();
export const skinSchema = entity.extend({
  attachments: z.record(z.array(attachmentSchema)),
  requiredBoneIds: z.array(id).optional(),
  requiredConstraintIds: z.array(id).optional(),
});
export const skeletonSchema = entity.extend({
  source: sourceProvenanceSchema.optional(),
  coordinateSystem: z.literal("x-right-y-up-ccw-radians"),
  fps: finite.positive(),
  bones: z.array(boneSchema),
  slots: z.array(slotSchema),
  skins: z.array(skinSchema),
  constraints: z.array(constraintSchema),
  animations: z.array(animationSchema),
  events: z.array(entity.extend({ defaults: extensions.optional() })),
  metadata: extensions.optional(),
  bounds: z
    .object({ x: finite, y: finite, width: nonnegative, height: nonnegative })
    .strict()
    .optional(),
});
export type BoneData = z.infer<typeof boneSchema>;
export type SlotData = z.infer<typeof slotSchema>;
export type AttachmentData = z.infer<typeof attachmentSchema>;
export type ConstraintData = z.infer<typeof constraintSchema>;
export type SkinData = z.infer<typeof skinSchema>;
export type TimelineData = z.infer<typeof timelineSchema>;
export type AnimationData = z.infer<typeof animationSchema>;
export type SourceProvenance = z.infer<typeof sourceProvenanceSchema>;
export type SkeletonData = z.infer<typeof skeletonSchema>;
