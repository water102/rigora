import { describe, expect, it } from "vitest";
import {
  createSetupSnapshot,
  createPoseSnapshot,
  solveTransformConstraint,
} from "../../packages/runtime/src/index.js";
import { ikSkeleton } from "../fixtures/canonical/ik-skeleton.js";
import type { SkeletonData } from "../../packages/model/src/index.js";

describe("Constraint Runtime — Batch 12", () => {
  it("solves 1-bone IK aiming accurately at target", () => {
    const { skeleton } = ikSkeleton();
    const result = createSetupSnapshot(skeleton);

    expect(result.success).toBe(true);
    if (!result.success) return;

    const boneLook = result.snapshot.bones.find((b) => b.id === "bone-look")!;
    expect(boneLook).toBeDefined();

    // Bone-look origin is (0, 0), length 10.
    // Target is at (0, 10).
    // With 1-bone IK, the bone tip should point directly at (0, 10).
    expect(boneLook.tip.x).toBeCloseTo(0, 4);
    expect(boneLook.tip.y).toBeCloseTo(10, 4);
  });

  it("respects 1-bone IK mix interpolation", () => {
    const { skeleton } = ikSkeleton();
    // Set mix to 0.5 (halfway between 0 and 90 degrees = 45 degrees)
    skeleton.constraints[0]!.mix = 0.5;

    const result = createSetupSnapshot(skeleton);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const boneLook = result.snapshot.bones.find((b) => b.id === "bone-look")!;
    // At 45 degrees, tip should be at (10 * cos(pi/4), 10 * sin(pi/4)) = (~7.071, ~7.071)
    expect(boneLook.tip.x).toBeCloseTo(10 * Math.cos(Math.PI / 4), 3);
    expect(boneLook.tip.y).toBeCloseTo(10 * Math.sin(Math.PI / 4), 3);

    // When mix is 0, points at original (10, 0)
    skeleton.constraints[0]!.mix = 0;
    const result0 = createSetupSnapshot(skeleton);
    expect(result0.success).toBe(true);
    if (!result0.success) return;
    const boneLook0 = result0.snapshot.bones.find((b) => b.id === "bone-look")!;
    expect(boneLook0.tip.x).toBeCloseTo(10, 4);
    expect(boneLook0.tip.y).toBeCloseTo(0, 4);
  });

  it("solves 2-bone analytic IK reaching target exactly", () => {
    const { skeleton } = ikSkeleton();
    const result = createSetupSnapshot(skeleton);

    expect(result.success).toBe(true);
    if (!result.success) return;

    const shin = result.snapshot.bones.find((b) => b.id === "bone-shin")!;
    expect(shin).toBeDefined();

    // Target is at (50, 20).
    // Shin tip (end effector) should touch target exactly!
    expect(shin.tip.x).toBeCloseTo(50, 3);
    expect(shin.tip.y).toBeCloseTo(20, 3);
  });

  it("mirrors elbow bend with bendDirection = -1", () => {
    const { skeleton: sk1 } = ikSkeleton();
    sk1.constraints[1]!.bendDirection = 1;
    const res1 = createSetupSnapshot(sk1);

    const { skeleton: sk2 } = ikSkeleton();
    sk2.constraints[1]!.bendDirection = -1;
    const res2 = createSetupSnapshot(sk2);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    if (!res1.success || !res2.success) return;

    const thigh1 = res1.snapshot.bones.find((b) => b.id === "bone-thigh")!;
    const thigh2 = res2.snapshot.bones.find((b) => b.id === "bone-thigh")!;

    // Both end at same target (50, 20), but knees/thighs bend opposite directions
    expect(thigh1.tip.x).not.toBeCloseTo(thigh2.tip.x, 2);
  });

  it("fully extends 2-bone IK toward unreachable target", () => {
    const { skeleton } = ikSkeleton();
    // Move target far away to (50, 100) (distance = 100, while L1 + L2 = 40)
    const targetFoot = skeleton.bones.find((b) => b.id === "target-foot")!;
    targetFoot.setup.y = 100;

    const result = createSetupSnapshot(skeleton);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const shin = result.snapshot.bones.find((b) => b.id === "bone-shin")!;
    // Both bones should align vertically toward (50, 100) up to max length 40
    expect(shin.tip.x).toBeCloseTo(50, 3);
    expect(shin.tip.y).toBeCloseTo(40, 3);
  });

  it("evaluates Transform Constraint copying source rotation", () => {
    const { skeleton } = ikSkeleton();
    const result = createSetupSnapshot(skeleton);

    expect(result.success).toBe(true);
    if (!result.success) return;

    const follower = result.snapshot.bones.find(
      (b) => b.id === "bone-follower",
    )!;
    // bone-source has rotation Math.PI / 4, follower copies it (origin (100, 50), length 10)
    expect(follower.tip.x).toBeCloseTo(100 + 10 * Math.cos(Math.PI / 4), 3);
    expect(follower.tip.y).toBeCloseTo(50 + 10 * Math.sin(Math.PI / 4), 3);
  });

  it("applies local shear and skips disabled constraints", () => {
    const { skeleton } = ikSkeleton();
    const transform = skeleton.constraints.find((c) => c.type === "transform")!;
    if (transform.type !== "transform") return;
    transform.local = true;
    transform.mixShearY = 0;
    transform.mixRotate = 1;
    transform.enabled = false;
    const source = skeleton.bones.find((b) => b.id === "bone-source")!;
    source.setup.rotation = Math.PI / 4;
    const follower = skeleton.bones.find((b) => b.id === "bone-follower")!;
    follower.setup.shearY = 0;
    const disabled = createSetupSnapshot(skeleton);
    expect(disabled.success).toBe(true);
    if (!disabled.success) return;
    const disabledBone = disabled.snapshot.bones.find(
      (b) => b.id === "bone-follower",
    )!;
    expect(disabledBone.tip.x).toBeCloseTo(110, 3);

    transform.enabled = true;
    const enabled = createSetupSnapshot(skeleton);
    expect(enabled.success).toBe(true);
    if (!enabled.success) return;
    const enabledBone = enabled.snapshot.bones.find(
      (b) => b.id === "bone-follower",
    )!;
    expect(enabledBone).toBeDefined();

    const target = {
      id: "target",
      length: 1,
      parentIndex: -1,
      local: {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        shearX: 0,
        shearY: Math.PI / 4,
      },
      world: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
    };
    const constrained = {
      ...target,
      id: "constrained",
      local: { ...target.local, shearY: 0 },
    };
    solveTransformConstraint(target, [constrained], {
      ...transform,
      local: true,
      mixRotate: 0,
      mixShearY: 1,
    });
    expect(constrained.local.shearY).toBeCloseTo(Math.PI / 4, 5);
  });

  it("propagates IK constrained bone transforms to attached skinned meshes", () => {
    const { skeleton } = ikSkeleton();

    // Attach a triangle mesh weighted to bone-look
    skeleton.skins[0]!.attachments["slot-look"] = [
      {
        id: "mesh-look",
        name: "mesh-look",
        type: "mesh",
        textureId: "texture-1",
        vertices: [],
        uvs: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
        triangles: [0, 1, 2],
        hullLength: 3,
        weightedVertices: [
          {
            bindPosition: { x: 0, y: 0 },
            influences: [
              { boneId: "bone-look", weight: 1, localPosition: { x: 0, y: 0 } },
            ],
          },
          {
            bindPosition: { x: 10, y: 0 },
            influences: [
              {
                boneId: "bone-look",
                weight: 1,
                localPosition: { x: 10, y: 0 },
              },
            ],
          },
          {
            bindPosition: { x: 0, y: 5 },
            influences: [
              { boneId: "bone-look", weight: 1, localPosition: { x: 0, y: 5 } },
            ],
          },
        ],
      },
    ];
    skeleton.slots.push({
      id: "slot-look",
      name: "slot-look",
      boneId: "bone-look",
      color: { r: 1, g: 1, b: 1, a: 1 },
      setupAttachmentId: "mesh-look",
      blendMode: "normal",
      zIndex: 0,
    });

    const result = createSetupSnapshot(skeleton);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.snapshot.meshes.length).toBe(1);
    const mesh = result.snapshot.meshes[0]!;
    // Vertex 1 was at (10, 0) in bone-look local space.
    // Because bone-look rotated 90 deg CCW due to IK target at (0, 10),
    // Vertex 1 should now be at world coordinate (0, 10)!
    expect(mesh.worldXY[2]).toBeCloseTo(0, 3);
    expect(mesh.worldXY[3]).toBeCloseTo(10, 3);
  });
});
