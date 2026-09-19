import { describe, expect, it } from "vitest";
import {
  createPoseSnapshot,
  createSetupSnapshot,
} from "../../packages/runtime/src/index.js";
import { animatedMeshSkeleton } from "../fixtures/canonical/animated-skeleton.js";

describe("Animated Playback Runtime", () => {
  it("evaluates setup pose when no animation is specified", () => {
    const { skeleton } = animatedMeshSkeleton();
    const setup = createSetupSnapshot(skeleton);
    const pose = createPoseSnapshot(skeleton);

    expect(setup.success).toBe(true);
    expect(pose.success).toBe(true);
    if (!setup.success || !pose.success) return;

    expect(pose.snapshot.bones).toEqual(setup.snapshot.bones);
    expect(pose.snapshot.meshes[0]!.worldXY).toEqual(
      setup.snapshot.meshes[0]!.worldXY,
    );
  });

  it("samples animated bone rotations, translations, and mesh deform across timeline", () => {
    const { skeleton, animationName } = animatedMeshSkeleton();

    // t = 0.0: Rest state
    const pose0 = createPoseSnapshot(skeleton, {
      animationName,
      time: 0.0,
    });
    expect(pose0.success).toBe(true);
    if (!pose0.success) return;
    expect(pose0.snapshot.bones[0]!.origin).toEqual({ x: 0, y: 0 });
    // Setup bone-1 length is 10, angle 0 -> tip at (10, 0)
    expect(pose0.snapshot.bones[0]!.tip.x).toBeCloseTo(10);
    expect(pose0.snapshot.bones[0]!.tip.y).toBeCloseTo(0);
    expect(pose0.snapshot.meshes[0]!.color.a).toBeCloseTo(1.0);

    // t = 0.5: Peak state (bone-1 rotated by PI/2, bone-2 translated, mesh deformed, slot faded)
    const poseMid = createPoseSnapshot(skeleton, {
      animationName,
      time: 0.5,
    });
    expect(poseMid.success).toBe(true);
    if (!poseMid.success) return;

    // Bone-1 rotated by 90 deg (PI/2) CCW: tip should now be at (0, 10)
    expect(poseMid.snapshot.bones[0]!.tip.x).toBeCloseTo(0);
    expect(poseMid.snapshot.bones[0]!.tip.y).toBeCloseTo(10);

    // Slot-1 alpha was faded to 0.5
    expect(poseMid.snapshot.meshes[0]!.color.a).toBeCloseTo(0.5);

    // Mesh vertices were deformed at t=0.5
    expect(poseMid.snapshot.meshes[0]!.worldXY).not.toEqual(
      pose0.snapshot.meshes[0]!.worldXY,
    );

    // t = 1.0: Returns to base cycle
    const poseEnd = createPoseSnapshot(skeleton, {
      animationName,
      time: 1.0,
    });
    expect(poseEnd.success).toBe(true);
    if (!poseEnd.success) return;

    expect(poseEnd.snapshot.bones[0]!.tip.x).toBeCloseTo(10);
    expect(poseEnd.snapshot.bones[0]!.tip.y).toBeCloseTo(0);
    expect(poseEnd.snapshot.meshes[0]!.color.a).toBeCloseTo(1.0);
  });

  it("handles loop and clamp playback options", () => {
    const { skeleton, animationName } = animatedMeshSkeleton();

    // Duration is 1.0s. At t = 1.5 with loop = true, should match t = 0.5
    const poseLoop = createPoseSnapshot(skeleton, {
      animationName,
      time: 1.5,
      loop: true,
    });
    const poseMid = createPoseSnapshot(skeleton, {
      animationName,
      time: 0.5,
    });
    expect(poseLoop.success).toBe(true);
    expect(poseMid.success).toBe(true);
    if (!poseLoop.success || !poseMid.success) return;

    expect(poseLoop.snapshot.bones[0]!.tip.x).toBeCloseTo(
      poseMid.snapshot.bones[0]!.tip.x,
    );
    expect(poseLoop.snapshot.bones[0]!.tip.y).toBeCloseTo(
      poseMid.snapshot.bones[0]!.tip.y,
    );

    // At t = 1.5 with loop = false, should clamp to t = 1.0
    const poseClamp = createPoseSnapshot(skeleton, {
      animationName,
      time: 1.5,
      loop: false,
    });
    const poseEnd = createPoseSnapshot(skeleton, {
      animationName,
      time: 1.0,
    });
    expect(poseClamp.success).toBe(true);
    expect(poseEnd.success).toBe(true);
    if (!poseClamp.success || !poseEnd.success) return;

    expect(poseClamp.snapshot.bones[0]!.tip.x).toBeCloseTo(
      poseEnd.snapshot.bones[0]!.tip.x,
    );
    expect(poseClamp.snapshot.bones[0]!.tip.y).toBeCloseTo(
      poseEnd.snapshot.bones[0]!.tip.y,
    );
  });

  it("reports diagnostic when animation is not found", () => {
    const { skeleton } = animatedMeshSkeleton();
    const result = createPoseSnapshot(skeleton, {
      animationName: "non-existent-animation",
    });
    expect(result.success).toBe(false);
    expect(result.diagnostics[0]!.code).toBe("RUNTIME_ANIMATION_NOT_FOUND");
  });
});
