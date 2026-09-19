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
export { MeshInstance, MeshRuntimeError } from "./mesh.js";
export type { DeformSpace } from "./mesh.js";

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
export interface DebugBone {
  id: string;
  origin: Vec2;
  tip: Vec2;
}
/** Region order is authoritative. Renderer must not inspect authored source data. */
export interface RenderSnapshot {
  regions: RegionSnapshot[];
  bones: DebugBone[];
}
export type SnapshotResult =
  | { success: true; snapshot: RenderSnapshot; diagnostics: Diagnostic[] }
  | { success: false; diagnostics: Diagnostic[] };

/** Setup-only reference path. No animation/constraint evaluation is implied. */
export function createSetupSnapshot(
  input: SkeletonData,
  skinId?: string,
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
  if (data.constraints.length)
    error(
      "RUNTIME_CONSTRAINTS_UNSUPPORTED",
      "Setup region runtime does not evaluate constraints.",
    );
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
  try {
    const hierarchy = compileTransformHierarchy(data.bones);
    const world = evaluateTransformHierarchy(hierarchy);
    const lengths = new Map(data.bones.map((bone) => [bone.id, bone.length]));
    const snapshot: RenderSnapshot = {
      regions: [],
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
      if (slot.setupAttachmentId === undefined) continue;
      const attachment = selected?.attachments[slot.id]?.find(
        (item) => item.id === slot.setupAttachmentId,
      );
      if (!attachment) {
        error(
          "RUNTIME_ATTACHMENT_NOT_FOUND",
          "Setup attachment is absent from the selected skin; no fallback applied.",
          slot.id,
        );
        continue;
      }
      if (attachment.type !== "region") {
        error(
          "RUNTIME_ATTACHMENT_UNSUPPORTED",
          `Cannot render ${attachment.type} attachment.`,
          attachment.id,
        );
        continue;
      }
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
        color: { ...slot.color },
        blendMode: slot.blendMode,
      });
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
