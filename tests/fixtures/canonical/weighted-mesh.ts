import type { MeshAttachment } from "../../../packages/model/src/index.js";
import { minimalSkeleton } from "./minimal.js";

export function weightedMeshSkeleton() {
  const skeleton = minimalSkeleton();
  skeleton.bones.push({
    ...structuredClone(skeleton.bones[0]!),
    id: "bone-2",
    name: "second",
    parentId: "bone-1",
  });
  const mesh: MeshAttachment = {
    type: "mesh",
    id: "mesh-1",
    name: "triangle",
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
          { boneId: "bone-1", weight: 1, localPosition: { x: 0, y: 0 } },
        ],
      },
      {
        bindPosition: { x: 10, y: 0 },
        influences: [
          { boneId: "bone-1", weight: 0.5, localPosition: { x: 10, y: 0 } },
          { boneId: "bone-2", weight: 0.5, localPosition: { x: 10, y: 0 } },
        ],
      },
      {
        bindPosition: { x: 0, y: 10 },
        influences: [
          { boneId: "bone-2", weight: 1, localPosition: { x: 0, y: 10 } },
        ],
      },
    ],
  };
  skeleton.skins[0]!.attachments["slot-1"] = [mesh];
  skeleton.slots[0]!.setupAttachmentId = mesh.id;
  return { skeleton, mesh };
}
