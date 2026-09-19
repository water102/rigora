import type { SkeletonData } from "../../../packages/model/src/index.js";

/**
 * Canonical test skeleton featuring:
 * 1. Path attachment with cubic Bezier geometry (open and closed)
 * 2. Weighted path attachment influenced by driver bones (LBS)
 * 3. Path constraint ("pc-open") binding bone chain ["bone-p1", "bone-p2", "bone-p3"] along the path
 */
export function pathSkeleton(): { skeleton: SkeletonData } {
  const skeleton: SkeletonData = {
    id: "skeleton-path",
    name: "path-skeleton",
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
      {
        id: "bone-path-anchor",
        name: "bone-path-anchor",
        parentId: "root",
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
      // Driving bones for weighted path
      {
        id: "bone-driver-1",
        name: "bone-driver-1",
        parentId: "root",
        length: 20,
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
      {
        id: "bone-driver-2",
        name: "bone-driver-2",
        parentId: "root",
        length: 20,
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
      // Constrained bone chain
      {
        id: "bone-p1",
        name: "bone-p1",
        parentId: "root",
        length: 30,
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
      {
        id: "bone-p2",
        name: "bone-p2",
        parentId: "root",
        length: 30,
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
      {
        id: "bone-p3",
        name: "bone-p3",
        parentId: "root",
        length: 30,
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
    ],
    slots: [
      {
        id: "slot-path",
        name: "slot-path",
        boneId: "bone-path-anchor",
        color: { r: 1, g: 1, b: 1, a: 1 },
        blendMode: "normal",
        zIndex: 0,
        setupAttachmentId: "attach-open-path",
      },
      {
        id: "slot-closed-path",
        name: "slot-closed-path",
        boneId: "bone-path-anchor",
        color: { r: 1, g: 1, b: 1, a: 1 },
        blendMode: "normal",
        zIndex: 1,
        setupAttachmentId: "attach-closed-path",
      },
      {
        id: "slot-weighted-path",
        name: "slot-weighted-path",
        boneId: "root",
        color: { r: 1, g: 1, b: 1, a: 1 },
        blendMode: "normal",
        zIndex: 2,
        setupAttachmentId: "attach-weighted-path",
      },
    ],
    skins: [
      {
        id: "skin-default",
        name: "default",
        attachments: {
          "slot-path": [
            {
              id: "attach-open-path",
              name: "open-path",
              type: "path",
              closed: false,
              constantSpeed: true,
              vertices: [
                { x: 0, y: 0 },
                { x: 25, y: 50 },
                { x: 75, y: 50 },
                { x: 100, y: 0 },
              ],
            },
          ],
          "slot-closed-path": [
            {
              id: "attach-closed-path",
              name: "closed-path",
              type: "path",
              closed: true,
              constantSpeed: true,
              vertices: [
                { x: 0, y: 0 },
                { x: 0, y: 50 },
                { x: 50, y: 100 },
                { x: 100, y: 100 },
                { x: 100, y: 50 },
                { x: 50, y: 0 },
              ],
            },
          ],
          "slot-weighted-path": [
            {
              id: "attach-weighted-path",
              name: "weighted-path",
              type: "path",
              closed: false,
              constantSpeed: true,
              vertices: [
                {
                  bindPosition: { x: 0, y: 0 },
                  influences: [
                    {
                      boneId: "bone-driver-1",
                      weight: 1,
                      localPosition: { x: 0, y: 0 },
                    },
                  ],
                },
                {
                  bindPosition: { x: 25, y: 30 },
                  influences: [
                    {
                      boneId: "bone-driver-1",
                      weight: 1,
                      localPosition: { x: 25, y: 30 },
                    },
                  ],
                },
                {
                  bindPosition: { x: 75, y: 30 },
                  influences: [
                    {
                      boneId: "bone-driver-2",
                      weight: 1,
                      localPosition: { x: -25, y: -20 },
                    },
                  ],
                },
                {
                  bindPosition: { x: 100, y: 50 },
                  influences: [
                    {
                      boneId: "bone-driver-2",
                      weight: 1,
                      localPosition: { x: 0, y: 0 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
    constraints: [
      {
        id: "pc-open",
        name: "pc-open",
        type: "path",
        order: 0,
        targetSlotId: "slot-path",
        boneIds: ["bone-p1", "bone-p2", "bone-p3"],
        positionMode: "percent",
        spacingMode: "length",
        rotateMode: "tangent",
        position: 0,
        spacing: 0,
        mixRotate: 1,
        mixX: 1,
        mixY: 1,
      },
    ],
    animations: [],
    events: [],
  };

  return { skeleton };
}
