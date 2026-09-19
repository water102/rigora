import type { SkeletonData } from "../../../packages/model/src/index.js";
import { identityTransform } from "../../../packages/math/src/index.js";

export function minimalSkeleton(): SkeletonData {
  return {
    id: "skeleton-1",
    name: "Synthetic fixture",
    coordinateSystem: "x-right-y-up-ccw-radians",
    fps: 30,
    source: { format: "hnn", version: "1", importMode: "strict", warnings: [] },
    bones: [
      {
        id: "bone-1",
        name: "root",
        setup: identityTransform(),
        length: 10,
        inherit: "normal",
      },
    ],
    slots: [
      {
        id: "slot-1",
        name: "slot",
        boneId: "bone-1",
        color: { r: 1, g: 1, b: 1, a: 1 },
        blendMode: "normal",
        zIndex: 0,
        setupAttachmentId: "point-1",
      },
    ],
    skins: [
      {
        id: "skin-1",
        name: "default",
        attachments: {
          "slot-1": [
            {
              id: "point-1",
              name: "point",
              type: "point",
              transform: identityTransform(),
            },
          ],
        },
      },
    ],
    constraints: [],
    animations: [],
    events: [],
  };
}
