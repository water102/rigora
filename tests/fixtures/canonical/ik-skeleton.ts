import type { SkeletonData } from "../../../packages/model/src/index.js";

/**
 * Canonical test skeleton featuring:
 * 1. One-bone IK constraint ("bone-look" pointing toward "target-look")
 * 2. Two-bone IK constraint ("bone-thigh" + "bone-shin" bending toward "target-foot")
 * 3. Transform constraint ("bone-follower" copying rotation of "bone-source")
 */
export function ikSkeleton(): { skeleton: SkeletonData } {
  const skeleton: SkeletonData = {
    id: "skeleton-ik",
    name: "ik-skeleton",
    coordinateSystem: "x-right-y-up-ccw-radians",
    fps: 30,
    bones: [
      {
        id: "root",
        name: "root",
        length: 0,
        setup: {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
      // 1-Bone IK Target & Effector
      {
        id: "bone-look",
        name: "bone-look",
        parentId: "root",
        length: 10,
        setup: {
          x: 0,
          y: 0,
          rotation: 0, // initially points along +X (10, 0)
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
      {
        id: "target-look",
        name: "target-look",
        parentId: "root",
        length: 0,
        setup: {
          x: 0,
          y: 10, // at (0, 10), 90 degrees CCW from bone-look
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
      // 2-Bone IK Chain & Target
      {
        id: "bone-thigh",
        name: "bone-thigh",
        parentId: "root",
        length: 20,
        setup: {
          x: 50,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
      {
        id: "bone-shin",
        name: "bone-shin",
        parentId: "bone-thigh",
        length: 20,
        setup: {
          x: 20,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
      {
        id: "target-foot",
        name: "target-foot",
        parentId: "root",
        length: 0,
        setup: {
          x: 50,
          y: 20, // reachable target (D = 20, L1 = 20, L2 = 20)
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
      // Transform constraint Source & Follower
      {
        id: "bone-source",
        name: "bone-source",
        parentId: "root",
        length: 10,
        setup: {
          x: 100,
          y: 0,
          rotation: Math.PI / 4, // 45 degrees
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
      {
        id: "bone-follower",
        name: "bone-follower",
        parentId: "root",
        length: 10,
        setup: {
          x: 100,
          y: 50,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
    ],
    slots: [],
    skins: [
      {
        id: "skin-default",
        name: "default",
        attachments: {},
      },
    ],
    constraints: [
      {
        id: "c-ik-look",
        name: "ik-look",
        type: "ik",
        order: 0,
        targetBoneId: "target-look",
        boneIds: ["bone-look"],
        mix: 1.0,
        bendDirection: 1,
      },
      {
        id: "c-ik-leg",
        name: "ik-leg",
        type: "ik",
        order: 1,
        targetBoneId: "target-foot",
        boneIds: ["bone-thigh", "bone-shin"],
        mix: 1.0,
        bendDirection: 1,
      },
      {
        id: "c-tc-follow",
        name: "tc-follow",
        type: "transform",
        order: 2,
        targetBoneId: "bone-source",
        boneIds: ["bone-follower"],
        mixRotate: 1.0,
        mixTranslateX: 0,
        mixTranslateY: 0,
        mixScaleX: 0,
        mixScaleY: 0,
        mixShearY: 0,
        local: false,
        relative: false,
      },
    ],
    animations: [],
    events: [],
  };

  return { skeleton };
}
