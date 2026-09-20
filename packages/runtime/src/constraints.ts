import {
  localToMatrix,
  multiply,
  transformPoint,
  type Mat2D,
  type Transform2D,
  type Vec2,
} from "@rigora/math";
import type { ConstraintData, SlotData, SkinData } from "@rigora/model";
import type { Diagnostic } from "@rigora/diagnostics";
import {
  compilePath,
  evaluatePathAttachmentWorldPoints,
  samplePathAtDistance,
  type PathAttachmentData,
} from "./path.js";
import type { PhysicsWorld } from "./physics.js";

export interface RuntimeBoneState {
  id: string;
  length: number;
  parentIndex: number;
  local: Transform2D;
  world: Mat2D;
}

export interface ConstraintContext {
  slots?: SlotData[] | undefined;
  skins?: SkinData[] | undefined;
  selectedSkinId?: string | undefined;
  physicsWorld?: PhysicsWorld | undefined;
  physicsElapsed?: number | undefined;
  physicsWind?: number | undefined;
}

/** Helper to wrap an angle into [-PI, PI]. */
export function wrapAngle(angle: number): number {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/** Creates a 2D rotation matrix around origin. */
export function rotationMatrix(rad: number): Mat2D {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { a: cos, b: sin, c: -sin, d: cos, tx: 0, ty: 0 };
}

/**
 * Solves One-Bone IK: rotates the bone so its length axis points toward target.
 */
export function solveOneBoneIk(
  bone: RuntimeBoneState,
  targetPos: Vec2,
  mix: number,
): void {
  if (mix <= 0) return;

  const originX = bone.world.tx;
  const originY = bone.world.ty;
  const dx = targetPos.x - originX;
  const dy = targetPos.y - originY;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return;

  // Desired world angle from bone origin to target
  const targetWorldAngle = Math.atan2(dy, dx);

  // Current world angle of bone along its primary X-axis
  const currentWorldAngle = Math.atan2(bone.world.b, bone.world.a);

  const deltaAngle = wrapAngle(targetWorldAngle - currentWorldAngle);
  const blendedDelta = deltaAngle * mix;

  // Rotate world matrix in-place
  const rot = rotationMatrix(blendedDelta);
  const origin = { x: bone.world.tx, y: bone.world.ty };
  const rotated = multiply(rot, { ...bone.world, tx: 0, ty: 0 });
  bone.world = { ...rotated, tx: origin.x, ty: origin.y };
}

/**
 * Solves Two-Bone Analytic IK via the Law of Cosines.
 */
export function solveTwoBoneIk(
  parentBone: RuntimeBoneState,
  childBone: RuntimeBoneState,
  targetPos: Vec2,
  mix: number,
  bendDirection: 1 | -1,
): void {
  if (mix <= 0) return;

  const p1x = parentBone.world.tx;
  const p1y = parentBone.world.ty;
  const p2x = childBone.world.tx;
  const p2y = childBone.world.ty;

  // Lengths in world units
  const l1 = Math.max(
    parentBone.length || Math.hypot(p2x - p1x, p2y - p1y),
    1e-4,
  );
  const l2 = Math.max(childBone.length || 1, 1e-4);

  const dx = targetPos.x - p1x;
  const dy = targetPos.y - p1y;
  const targetDist = Math.hypot(dx, dy);
  if (targetDist < 1e-6) return;

  // Law of cosines: cos(alpha2) = (D^2 - L1^2 - L2^2) / (2 * L1 * L2)
  let cosAngle2 = (targetDist * targetDist - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  cosAngle2 = Math.max(-1, Math.min(1, cosAngle2));

  // Child angle relative to parent
  const angle2 = bendDirection * Math.acos(cosAngle2);

  // Parent angle
  const angleToTarget = Math.atan2(dy, dx);
  const parentInternal = Math.atan2(
    l2 * Math.sin(angle2),
    l1 + l2 * Math.cos(angle2),
  );
  const angle1 = angleToTarget - parentInternal;

  // Current world angles
  const currentParentAngle = Math.atan2(parentBone.world.b, parentBone.world.a);
  const currentChildAngle = Math.atan2(childBone.world.b, childBone.world.a);

  const deltaParent = wrapAngle(angle1 - currentParentAngle) * mix;
  const desiredChildWorldAngle = angle1 + angle2;
  const deltaChild =
    wrapAngle(desiredChildWorldAngle - currentChildAngle) * mix;

  // Update parent world
  const rot1 = rotationMatrix(deltaParent);
  const parentRotated = multiply(rot1, { ...parentBone.world, tx: 0, ty: 0 });
  parentBone.world = { ...parentRotated, tx: p1x, ty: p1y };

  // New child origin from updated parent
  const newChildOrigin = transformPoint(parentBone.world, {
    x: parentBone.length || l1,
    y: 0,
  });

  // Update child world
  const rot2 = rotationMatrix(deltaChild);
  const childRotated = multiply(rot2, { ...childBone.world, tx: 0, ty: 0 });
  childBone.world = {
    ...childRotated,
    tx: newChildOrigin.x,
    ty: newChildOrigin.y,
  };
}

/**
 * Solves Transform Constraint mixing rotation, translation, and scale from target to constrained bones.
 */
export function solveTransformConstraint(
  targetBone: RuntimeBoneState,
  constrainedBones: RuntimeBoneState[],
  constraint: Extract<ConstraintData, { type: "transform" }>,
): void {
  for (const bone of constrainedBones) {
    if (constraint.local) {
      // Local mixing
      if (constraint.relative) {
        bone.local.rotation += targetBone.local.rotation * constraint.mixRotate;
        bone.local.x += targetBone.local.x * constraint.mixTranslateX;
        bone.local.y += targetBone.local.y * constraint.mixTranslateY;
        bone.local.scaleX +=
          (targetBone.local.scaleX - 1) * constraint.mixScaleX;
        bone.local.scaleY +=
          (targetBone.local.scaleY - 1) * constraint.mixScaleY;
        bone.local.shearY += targetBone.local.shearY * constraint.mixShearY;
      } else {
        bone.local.rotation =
          bone.local.rotation * (1 - constraint.mixRotate) +
          targetBone.local.rotation * constraint.mixRotate;
        bone.local.x =
          bone.local.x * (1 - constraint.mixTranslateX) +
          targetBone.local.x * constraint.mixTranslateX;
        bone.local.y =
          bone.local.y * (1 - constraint.mixTranslateY) +
          targetBone.local.y * constraint.mixTranslateY;
        bone.local.scaleX =
          bone.local.scaleX * (1 - constraint.mixScaleX) +
          targetBone.local.scaleX * constraint.mixScaleX;
        bone.local.scaleY =
          bone.local.scaleY * (1 - constraint.mixScaleY) +
          targetBone.local.scaleY * constraint.mixScaleY;
        bone.local.shearY =
          bone.local.shearY * (1 - constraint.mixShearY) +
          targetBone.local.shearY * constraint.mixShearY;
      }
    } else {
      // World mixing
      const targetWorldX = targetBone.world.tx;
      const targetWorldY = targetBone.world.ty;
      const targetRot = Math.atan2(targetBone.world.b, targetBone.world.a);

      const boneRot = Math.atan2(bone.world.b, bone.world.a);
      const deltaRot = wrapAngle(targetRot - boneRot) * constraint.mixRotate;

      if (constraint.mixRotate > 0) {
        const rot = rotationMatrix(deltaRot);
        const origin = { x: bone.world.tx, y: bone.world.ty };
        const rotated = multiply(rot, { ...bone.world, tx: 0, ty: 0 });
        bone.world = { ...rotated, tx: origin.x, ty: origin.y };
      }

      if (constraint.mixTranslateX > 0 || constraint.mixTranslateY > 0) {
        if (constraint.relative) {
          bone.world.tx += targetWorldX * constraint.mixTranslateX;
          bone.world.ty += targetWorldY * constraint.mixTranslateY;
        } else {
          bone.world.tx =
            bone.world.tx * (1 - constraint.mixTranslateX) +
            targetWorldX * constraint.mixTranslateX;
          bone.world.ty =
            bone.world.ty * (1 - constraint.mixTranslateY) +
            targetWorldY * constraint.mixTranslateY;
        }
      }
    }
  }
}

/**
 * Solves Path Constraint: places and aligns a chain of bones along a target path attachment.
 */
export function solvePathConstraint(
  pathAttachment: PathAttachmentData,
  slotBone: RuntimeBoneState,
  constrainedBones: RuntimeBoneState[],
  constraint: Extract<ConstraintData, { type: "path" }>,
  bonesById: Map<string, RuntimeBoneState>,
): void {
  if (constrainedBones.length === 0) return;

  // 1. Evaluate path world points (supports unweighted and LBS skinned)
  const worldPoints = evaluatePathAttachmentWorldPoints(
    pathAttachment,
    slotBone.world,
    bonesById,
  );
  if (worldPoints.length < 2) return;

  // 2. Compile path geometry and arc-length table
  const compiledPath = compilePath(
    worldPoints,
    pathAttachment.closed,
    pathAttachment.constantSpeed,
  );
  const totalLength = compiledPath.totalLength;

  // 3. Compute starting position on path
  let currentDist =
    constraint.positionMode === "percent"
      ? constraint.position * totalLength
      : constraint.position;

  // 4. Calculate sampling distance for each bone
  const boneDistances: number[] = [];
  for (let i = 0; i < constrainedBones.length; i++) {
    boneDistances.push(currentDist);
    if (i < constrainedBones.length - 1) {
      if (constraint.spacingMode === "percent") {
        currentDist += constraint.spacing * totalLength;
      } else if (constraint.spacingMode === "fixed") {
        currentDist += constraint.spacing;
      } else {
        // "length": spacing based on bone length + authored spacing offset
        const bLen = constrainedBones[i]!.length || 1;
        currentDist += bLen + constraint.spacing;
      }
    }
  }

  // 5. Sample positions and tangents
  const samples = boneDistances.map((d) =>
    samplePathAtDistance(compiledPath, d),
  );

  // 6. Orient and place each bone
  for (let i = 0; i < constrainedBones.length; i++) {
    const bone = constrainedBones[i]!;
    const sample = samples[i]!;

    let targetAngle = sample.tangentAngle;
    let scaleRatio = 1;

    if (
      constraint.rotateMode === "chain" ||
      constraint.rotateMode === "chainScale"
    ) {
      if (i < constrainedBones.length - 1) {
        const nextSample = samples[i + 1]!;
        const dx = nextSample.x - sample.x;
        const dy = nextSample.y - sample.y;
        targetAngle = Math.atan2(dy, dx);

        if (constraint.rotateMode === "chainScale") {
          const dist = Math.hypot(dx, dy);
          const bLen = Math.max(bone.length, 1e-4);
          scaleRatio = dist / bLen;
        }
      } else {
        // For the last bone in a chain, sample ahead by bone length to preserve chain orientation
        const aheadDist = boneDistances[i]! + Math.max(bone.length, 1);
        const aheadSample = samplePathAtDistance(compiledPath, aheadDist);
        const dx = aheadSample.x - sample.x;
        const dy = aheadSample.y - sample.y;
        if (Math.hypot(dx, dy) > 1e-6) {
          targetAngle = Math.atan2(dy, dx);
        } else {
          targetAngle = sample.tangentAngle;
        }
      }
    }

    // Blend translation
    const origX = bone.world.tx;
    const origY = bone.world.ty;
    const newX = origX * (1 - constraint.mixX) + sample.x * constraint.mixX;
    const newY = origY * (1 - constraint.mixY) + sample.y * constraint.mixY;

    // Blend rotation
    const currentAngle = Math.atan2(bone.world.b, bone.world.a);
    const deltaAngle =
      wrapAngle(targetAngle - currentAngle) * constraint.mixRotate;

    const rot = rotationMatrix(deltaAngle);
    let rotated = multiply(rot, { ...bone.world, tx: 0, ty: 0 });

    // If chainScale, apply scale ratio along the primary length axis
    if (constraint.rotateMode === "chainScale" && scaleRatio !== 1) {
      const blendedScale = 1 + (scaleRatio - 1) * constraint.mixRotate;
      rotated = {
        ...rotated,
        a: rotated.a * blendedScale,
        b: rotated.b * blendedScale,
      };
    }

    bone.world = {
      ...rotated,
      tx: newX,
      ty: newY,
    };
  }
}

/**
 * Re-evaluates descendants' world transforms after upstream bone changes.
 */
export function refreshDescendants(
  startIndex: number,
  bones: RuntimeBoneState[],
): void {
  for (let i = startIndex + 1; i < bones.length; i++) {
    const bone = bones[i]!;
    if (bone.parentIndex >= startIndex) {
      const parent = bones[bone.parentIndex]!;
      bone.world = multiply(parent.world, localToMatrix(bone.local));
    }
  }
}

/**
 * Executes all skeleton constraints in canonical list order.
 */
export function applyConstraints(
  constraints: ConstraintData[],
  bones: RuntimeBoneState[],
  diagnostics: Diagnostic[],
  context?: ConstraintContext,
): void {
  const boneMap = new Map<string, { bone: RuntimeBoneState; index: number }>();
  for (let i = 0; i < bones.length; i++) {
    boneMap.set(bones[i]!.id, { bone: bones[i]!, index: i });
  }

  for (const c of [...constraints].sort((a, b) => a.order - b.order)) {
    if (c.enabled === false) continue;
    if (c.type === "ik") {
      const targetEntry = boneMap.get(c.targetBoneId);
      if (!targetEntry) {
        diagnostics.push({
          code: "RUNTIME_CONSTRAINT_TARGET_NOT_FOUND",
          severity: "warning",
          message: `IK target bone "${c.targetBoneId}" not found.`,
          entityId: c.id,
        });
        continue;
      }
      const targetPos = {
        x: targetEntry.bone.world.tx,
        y: targetEntry.bone.world.ty,
      };

      if (c.boneIds.length === 1) {
        const boneEntry = boneMap.get(c.boneIds[0]!);
        if (boneEntry) {
          solveOneBoneIk(boneEntry.bone, targetPos, c.mix);
          refreshDescendants(boneEntry.index, bones);
        }
      } else if (c.boneIds.length >= 2) {
        const parentEntry = boneMap.get(c.boneIds[0]!);
        const childEntry = boneMap.get(c.boneIds[1]!);
        if (parentEntry && childEntry) {
          solveTwoBoneIk(
            parentEntry.bone,
            childEntry.bone,
            targetPos,
            c.mix,
            c.bendDirection,
          );
          refreshDescendants(childEntry.index, bones);
        }
      }
    } else if (c.type === "transform") {
      const targetEntry = boneMap.get(c.targetBoneId);
      if (!targetEntry) {
        diagnostics.push({
          code: "RUNTIME_CONSTRAINT_TARGET_NOT_FOUND",
          severity: "warning",
          message: `Transform target bone "${c.targetBoneId}" not found.`,
          entityId: c.id,
        });
        continue;
      }

      const affectedBones: RuntimeBoneState[] = [];
      let minAffectedIndex = bones.length;
      for (const bId of c.boneIds) {
        const entry = boneMap.get(bId);
        if (entry) {
          affectedBones.push(entry.bone);
          if (entry.index < minAffectedIndex) minAffectedIndex = entry.index;
        }
      }

      if (affectedBones.length > 0) {
        solveTransformConstraint(targetEntry.bone, affectedBones, c);
        refreshDescendants(minAffectedIndex, bones);
      }
    } else if (c.type === "path") {
      const slot = context?.slots?.find((s) => s.id === c.targetSlotId);
      if (!slot) {
        diagnostics.push({
          code: "RUNTIME_CONSTRAINT_TARGET_NOT_FOUND",
          severity: "warning",
          message: `Path target slot "${c.targetSlotId}" not found.`,
          entityId: c.id,
        });
        continue;
      }

      const slotBoneEntry = boneMap.get(slot.boneId);
      if (!slotBoneEntry) {
        diagnostics.push({
          code: "RUNTIME_CONSTRAINT_TARGET_NOT_FOUND",
          severity: "warning",
          message: `Path target slot bone "${slot.boneId}" not found.`,
          entityId: c.id,
        });
        continue;
      }

      // Find active path attachment in selected or default skin
      let pathAttachment: PathAttachmentData | undefined;
      const targetAttachmentId = slot.setupAttachmentId;
      const skins = context?.skins ?? [];
      const selectedSkin =
        skins.find((s) => s.id === context?.selectedSkinId) ?? skins[0];

      if (selectedSkin) {
        const slotAttachments = selectedSkin.attachments[slot.id] ?? [];
        pathAttachment = slotAttachments.find(
          (a) =>
            a.type === "path" &&
            (!targetAttachmentId || a.id === targetAttachmentId),
        ) as PathAttachmentData | undefined;
      }

      if (!pathAttachment) {
        for (const skin of skins) {
          const slotAttachments = skin.attachments[slot.id] ?? [];
          pathAttachment = slotAttachments.find(
            (a) =>
              a.type === "path" &&
              (!targetAttachmentId || a.id === targetAttachmentId),
          ) as PathAttachmentData | undefined;
          if (pathAttachment) break;
        }
      }

      if (!pathAttachment) {
        diagnostics.push({
          code: "RUNTIME_PATH_ATTACHMENT_NOT_FOUND",
          severity: "warning",
          message: `Path attachment for slot "${c.targetSlotId}" not found.`,
          entityId: c.id,
        });
        continue;
      }

      const affectedBones: RuntimeBoneState[] = [];
      let minAffectedIndex = bones.length;
      for (const bId of c.boneIds) {
        const entry = boneMap.get(bId);
        if (entry) {
          affectedBones.push(entry.bone);
          if (entry.index < minAffectedIndex) minAffectedIndex = entry.index;
        }
      }

      if (affectedBones.length > 0) {
        const bonesById = new Map<string, RuntimeBoneState>();
        for (const b of bones) bonesById.set(b.id, b);

        solvePathConstraint(
          pathAttachment,
          slotBoneEntry.bone,
          affectedBones,
          c,
          bonesById,
        );
        refreshDescendants(minAffectedIndex, bones);
      }
    } else if (c.type === "physics") {
      if (context?.physicsWorld) {
        context.physicsWorld.step(
          context.physicsElapsed ?? 0,
          [c],
          context.physicsWind ?? 0,
        );
        const state = context.physicsWorld.get(c.boneId);
        const entry = boneMap.get(c.boneId);
        if (state && entry) {
          entry.bone.world = {
            ...entry.bone.world,
            tx: entry.bone.world.tx + state.x,
            ty: entry.bone.world.ty + state.y,
          };
          refreshDescendants(entry.index, bones);
        }
      } else {
        diagnostics.push({
          code: "RUNTIME_PHYSICS_WORLD_REQUIRED",
          severity: "warning",
          message: `Physics constraint "${c.id}" was skipped because no physics world was provided.`,
          entityId: c.id,
        });
      }
    } else {
      diagnostics.push({
        code: "RUNTIME_CONSTRAINTS_UNSUPPORTED",
        severity: "error",
        message: `Constraint type "${c.type}" is unsupported in setup runtime.`,
        entityId: c.id,
      });
    }
  }
}
