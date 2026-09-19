import {
  compileTransformHierarchy,
  evaluateTransformHierarchy,
  localToMatrix,
  multiply,
  transformPoint,
  type Mat2D,
  type Rgba,
  type Vec2,
} from "@rigora/math";
import { validateSkeleton, type SkeletonData } from "@rigora/model";
import type { Diagnostic } from "@rigora/diagnostics";
import { MeshInstance, MeshRuntimeError, type DeformSpace } from "./mesh.js";
import {
  applyConstraints,
  solveOneBoneIk,
  solveTwoBoneIk,
  solveTransformConstraint,
  solvePathConstraint,
  refreshDescendants,
  type RuntimeBoneState,
  type ConstraintContext,
} from "./constraints.js";
export {
  MeshInstance,
  MeshRuntimeError,
  type DeformSpace,
  applyConstraints,
  solveOneBoneIk,
  solveTwoBoneIk,
  solveTransformConstraint,
  solvePathConstraint,
  refreshDescendants,
  type RuntimeBoneState,
  type ConstraintContext,
};
export * from "./path.js";

export interface RegionSnapshot {
  slotId: string;
  attachmentId: string;
  textureId: string;
  world: Mat2D;
  width: number;
  height: number;
  color: Rgba;
  blendMode: "normal" | "additive" | "multiply" | "screen";
}
export interface MeshSnapshot {
  slotId: string;
  attachmentId: string;
  textureId: string;
  worldXY: Float32Array;
  uvs: Float32Array;
  triangles: Uint32Array;
  color: Rgba;
  blendMode: "normal" | "additive" | "multiply" | "screen";
}
export interface DebugBone {
  id: string;
  origin: Vec2;
  tip: Vec2;
}
/** Region and mesh order are authoritative. Renderer must not inspect authored source data. */
export interface RenderSnapshot {
  regions: RegionSnapshot[];
  meshes: MeshSnapshot[];
  bones: DebugBone[];
}
export type SnapshotResult =
  | { success: true; snapshot: RenderSnapshot; diagnostics: Diagnostic[] }
  | { success: false; diagnostics: Diagnostic[] };

import {
  NumericTimeline,
  DeformTimeline,
  animationTime,
  type DeformKeyframe,
} from "@rigora/animation";

export interface PoseOptions {
  animationName?: string | undefined;
  time?: number | undefined;
  loop?: boolean | undefined;
  skinId?: string | undefined;
}

/** Evaluates a skeleton pose at a given time or setup pose if no animation is specified. */
export function createPoseSnapshot(
  input: SkeletonData,
  options?: PoseOptions,
): SnapshotResult {
  const validation = validateSkeleton(input);
  const diagnostics: Diagnostic[] = [...validation.diagnostics];
  if (!validation.success) return { success: false, diagnostics };
  const data = validation.data;
  const error = (code: string, message: string, entityId?: string) =>
    diagnostics.push({
      code,
      severity: "error",
      message,
      ...(entityId ? { entityId } : {}),
    });

  const skinId = options?.skinId;
  const selected =
    skinId === undefined
      ? (data.skins.find((skin) => skin.name === "default") ?? data.skins[0])
      : data.skins.find((skin) => skin.id === skinId);
  if (skinId !== undefined && !selected)
    error("RUNTIME_SKIN_NOT_FOUND", "Requested skin does not exist.", skinId);
  if (
    selected?.requiredBoneIds?.length ||
    selected?.requiredConstraintIds?.length
  )
    error(
      "RUNTIME_SKIN_REQUIREMENTS_UNSUPPORTED",
      "Skin activation requirements are not evaluated.",
    );

  const anim =
    options?.animationName !== undefined
      ? (data.animations.find(
          (a) =>
            a.name === options.animationName || a.id === options.animationName,
        ) ??
        (() => {
          error(
            "RUNTIME_ANIMATION_NOT_FOUND",
            `Animation not found: ${options.animationName}`,
          );
          return undefined;
        })())
      : undefined;

  const localTime = anim
    ? animationTime(options?.time ?? 0, anim.duration, options?.loop ?? true)
    : 0;

  try {
    const bones = data.bones.map((bone) => {
      const setup = { ...bone.setup };
      if (anim) {
        // Rotate timeline
        const rotTl = anim.timelines.find(
          (tl) => tl.type === "bone.rotate" && tl.targetId === bone.id,
        );
        if (rotTl) {
          const tl = new NumericTimeline(
            rotTl.keyframes.map((k) => ({
              time: k.time,
              value: k.value as number,
              curve: k.curve as any,
            })),
            "shortest",
          );
          const sample = tl.sample(localTime);
          if (sample !== undefined) setup.rotation += sample;
        }

        // Translate timeline
        const transTl = anim.timelines.find(
          (tl) => tl.type === "bone.translate" && tl.targetId === bone.id,
        );
        if (transTl) {
          const tlX = new NumericTimeline(
            transTl.keyframes.map((k) => ({
              time: k.time,
              value: (k.value as any).x,
              curve: k.curve as any,
            })),
          );
          const tlY = new NumericTimeline(
            transTl.keyframes.map((k) => ({
              time: k.time,
              value: (k.value as any).y,
              curve: k.curve as any,
            })),
          );
          const dx = tlX.sample(localTime);
          const dy = tlY.sample(localTime);
          if (dx !== undefined) setup.x += dx;
          if (dy !== undefined) setup.y += dy;
        }

        // Scale timeline
        const scaleTl = anim.timelines.find(
          (tl) => tl.type === "bone.scale" && tl.targetId === bone.id,
        );
        if (scaleTl) {
          const tlX = new NumericTimeline(
            scaleTl.keyframes.map((k) => ({
              time: k.time,
              value: typeof k.value === "number" ? k.value : (k.value as any).x,
              curve: k.curve as any,
            })),
          );
          const tlY = new NumericTimeline(
            scaleTl.keyframes.map((k) => ({
              time: k.time,
              value: typeof k.value === "number" ? k.value : (k.value as any).y,
              curve: k.curve as any,
            })),
          );
          const sx = tlX.sample(localTime);
          const sy = tlY.sample(localTime);
          if (sx !== undefined) setup.scaleX *= sx;
          if (sy !== undefined) setup.scaleY *= sy;
        }
      }
      return { ...bone, setup };
    });

    const lengths = new Map(bones.map((bone) => [bone.id, bone.length]));
    const hierarchy = compileTransformHierarchy(bones);
    const initialWorld = evaluateTransformHierarchy(hierarchy);

    const runtimeBones: RuntimeBoneState[] = hierarchy.bones.map((bone, i) => ({
      id: bone.id,
      length: lengths.get(bone.id) ?? 0,
      parentIndex: hierarchy.parentIndices[i]!,
      local: { ...bone.setup },
      world: { ...initialWorld[i]! },
    }));

    applyConstraints(data.constraints, runtimeBones, diagnostics, {
      slots: data.slots,
      skins: data.skins,
      selectedSkinId: selected?.id,
    });
    const world = runtimeBones.map((b) => b.world);
    const snapshot: RenderSnapshot = {
      regions: [],
      meshes: [],
      bones: hierarchy.bones.map((bone, i) => ({
        id: bone.id,
        origin: transformPoint(world[i]!, { x: 0, y: 0 }),
        tip: transformPoint(world[i]!, {
          x: lengths.get(bone.id)!,
          y: 0,
        }),
      })),
    };

    for (const slot of [...data.slots].sort((a, b) => a.zIndex - b.zIndex)) {
      let activeAttachmentId = slot.setupAttachmentId;
      const slotColor = { ...slot.color };

      if (anim) {
        // Attachment switch timeline
        const attachTl = anim.timelines.find(
          (tl) => tl.type === "slot.attachment" && tl.targetId === slot.id,
        );
        if (attachTl) {
          for (const k of attachTl.keyframes) {
            if (k.time <= localTime) {
              activeAttachmentId = (k.value as string) || undefined;
            } else break;
          }
        }

        // Slot color timeline
        const colorTl = anim.timelines.find(
          (tl) => tl.type === "slot.color" && tl.targetId === slot.id,
        );
        if (colorTl) {
          const tlR = new NumericTimeline(
            colorTl.keyframes.map((k) => ({
              time: k.time,
              value: (k.value as any).r,
              curve: k.curve as any,
            })),
          );
          const tlG = new NumericTimeline(
            colorTl.keyframes.map((k) => ({
              time: k.time,
              value: (k.value as any).g,
              curve: k.curve as any,
            })),
          );
          const tlB = new NumericTimeline(
            colorTl.keyframes.map((k) => ({
              time: k.time,
              value: (k.value as any).b,
              curve: k.curve as any,
            })),
          );
          const tlA = new NumericTimeline(
            colorTl.keyframes.map((k) => ({
              time: k.time,
              value: (k.value as any).a,
              curve: k.curve as any,
            })),
          );
          const r = tlR.sample(localTime);
          const g = tlG.sample(localTime);
          const b = tlB.sample(localTime);
          const a = tlA.sample(localTime);
          if (r !== undefined) slotColor.r = r;
          if (g !== undefined) slotColor.g = g;
          if (b !== undefined) slotColor.b = b;
          if (a !== undefined) slotColor.a = a;
        }
      }

      if (activeAttachmentId === undefined) continue;
      const attachment = selected?.attachments[slot.id]?.find(
        (item) => item.id === activeAttachmentId,
      );
      if (!attachment) {
        error(
          "RUNTIME_ATTACHMENT_NOT_FOUND",
          "Attachment is absent from the selected skin; no fallback applied.",
          slot.id,
        );
        continue;
      }
      if (attachment.type === "region") {
        if (slot.darkColor) {
          error(
            "RUNTIME_TWO_COLOR_UNSUPPORTED",
            "Two-color tinting is not implemented.",
            slot.id,
          );
          continue;
        }
        if (attachment.pivot !== undefined) {
          error(
            "RUNTIME_PIVOT_UNSUPPORTED",
            "Region pivots must be normalized into centered transforms.",
            attachment.id,
          );
          continue;
        }
        snapshot.regions.push({
          slotId: slot.id,
          attachmentId: attachment.id,
          textureId: attachment.textureId,
          world: multiply(
            world[hierarchy.indexById.get(slot.boneId)!]!,
            localToMatrix(attachment.transform),
          ),
          width: attachment.width,
          height: attachment.height,
          color: slotColor,
          blendMode: slot.blendMode,
        });
      } else if (attachment.type === "mesh") {
        if (slot.darkColor) {
          error(
            "RUNTIME_TWO_COLOR_UNSUPPORTED",
            "Two-color tinting is not implemented.",
            slot.id,
          );
          continue;
        }
        const textureId = attachment.textureId;
        if (!textureId) {
          error(
            "RUNTIME_ATTACHMENT_NO_TEXTURE",
            "Mesh attachment has no texture ID.",
            attachment.id,
          );
          continue;
        }
        try {
          const meshInstance = new MeshInstance(data, attachment.id);
          let deformTl: DeformTimeline | undefined;
          if (anim) {
            const rawDeformTl = anim.timelines.find(
              (tl) => tl.type === "deform" && tl.targetId === attachment.id,
            );
            if (rawDeformTl) {
              deformTl = new DeformTimeline(
                attachment.id,
                meshInstance.deform.length,
                rawDeformTl.keyframes as unknown as readonly DeformKeyframe[],
              );
            }
          }
          const worldXY = meshInstance.sampleAndEvaluate(
            localTime,
            world,
            deformTl,
          );
          snapshot.meshes.push({
            slotId: slot.id,
            attachmentId: attachment.id,
            textureId,
            worldXY: new Float32Array(worldXY),
            uvs: new Float32Array(meshInstance.uvs),
            triangles: new Uint32Array(meshInstance.triangles),
            color: slotColor,
            blendMode: slot.blendMode,
          });
        } catch (meshErr) {
          error(
            "RUNTIME_MESH_EVAL_FAILED",
            meshErr instanceof Error
              ? meshErr.message
              : "Mesh evaluation failed.",
            attachment.id,
          );
          continue;
        }
      } else if (attachment.type === "path") {
        // Path attachments serve as constraint guides; they are evaluated during constraint solving.
        continue;
      } else {
        error(
          "RUNTIME_ATTACHMENT_UNSUPPORTED",
          `Cannot render ${attachment.type} attachment.`,
          attachment.id,
        );
        continue;
      }
    }
    return diagnostics.some((item) => item.severity === "error")
      ? { success: false, diagnostics }
      : { success: true, snapshot, diagnostics };
  } catch (errorValue) {
    error(
      "RUNTIME_TRANSFORM_FAILED",
      errorValue instanceof Error
        ? errorValue.message
        : "Transform evaluation failed.",
    );
    return { success: false, diagnostics };
  }
}

/** Setup-only reference path. Calls createPoseSnapshot without an animation. */
export function createSetupSnapshot(
  input: SkeletonData,
  skinId?: string,
): SnapshotResult {
  return createPoseSnapshot(input, { skinId });
}
