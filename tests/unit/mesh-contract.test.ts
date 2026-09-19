import { expect, it } from "vitest";
import {
  meshAttachmentSchema,
  weightedVertexSchema,
  validateSkeleton,
  serializeSkeletonSnapshot,
  parseSkeletonSnapshot,
} from "../../packages/model/src/index.js";
import { weightedMeshSkeleton } from "../fixtures/canonical/weighted-mesh.js";

it("exports mesh/weight schemas and round-trips sparse influence data without mutation", () => {
  const { skeleton, mesh } = weightedMeshSkeleton();
  expect(meshAttachmentSchema.safeParse(mesh).success).toBe(true);
  expect(
    weightedVertexSchema.safeParse(mesh.weightedVertices![0]).success,
  ).toBe(true);
  const before = structuredClone(skeleton);
  expect(validateSkeleton(skeleton).success).toBe(true);
  expect(parseSkeletonSnapshot(serializeSkeletonSnapshot(skeleton))).toEqual(
    skeleton,
  );
  expect(skeleton).toEqual(before);
});
it("rejects repeated influence bones even if their sum is one", () => {
  const { skeleton, mesh } = weightedMeshSkeleton();
  mesh.weightedVertices![1]!.influences[1]!.boneId = "bone-1";
  const result = validateSkeleton(skeleton);
  expect(result.success).toBe(false);
  expect(result.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "CORE_DUPLICATE_INFLUENCE",
      jsonPointer:
        "/skins/0/attachments/slot-1/0/weightedVertices/1/influences/1/boneId",
    }),
  );
});
it.each([
  [0, 0, 1],
  [0, 1, 1],
  [2, 0, 2],
])("rejects repeated triangle indices %j", (...triangle) => {
  const { skeleton, mesh } = weightedMeshSkeleton();
  mesh.triangles = triangle;
  expect(
    validateSkeleton(skeleton).diagnostics.some(
      (d) => d.code === "CORE_DEGENERATE_TRIANGLE",
    ),
  ).toBe(true);
});
it("rejects collinear geometry and inconsistent optional vertex arrays", () => {
  const { skeleton, mesh } = weightedMeshSkeleton();
  mesh.weightedVertices![2]!.bindPosition = { x: 20, y: 0 };
  mesh.vertices = [{ x: 0, y: 0 }];
  const codes = validateSkeleton(skeleton).diagnostics.map((d) => d.code);
  expect(codes).toContain("CORE_DEGENERATE_TRIANGLE");
  expect(codes).toContain("CORE_INVALID_MESH");
});
it.each([1e-150, 1, 1e150])(
  "accepts well-shaped triangles across scale %s",
  (scale) => {
    const { skeleton, mesh } = weightedMeshSkeleton();
    for (const vertex of mesh.weightedVertices!) {
      vertex.bindPosition.x *= scale;
      vertex.bindPosition.y *= scale;
    }
    expect(validateSkeleton(skeleton).success).toBe(true);
  },
);
it("validates unweighted geometry and linked mesh references", () => {
  const { skeleton, mesh } = weightedMeshSkeleton();
  mesh.vertices = mesh.weightedVertices!.map((vertex) => vertex.bindPosition);
  delete mesh.weightedVertices;
  expect(validateSkeleton(skeleton).success).toBe(true);
  skeleton.skins[0]!.attachments["slot-1"]!.push({
    type: "mesh",
    id: "linked",
    name: "linked",
    vertices: [],
    uvs: [],
    triangles: [],
    linkedMeshId: "mesh-1",
    inheritDeform: true,
  });
  expect(validateSkeleton(skeleton).success).toBe(true);
  mesh.linkedMeshId = "linked";
  expect(
    validateSkeleton(skeleton).diagnostics.some(
      (d) => d.code === "CORE_CYCLIC_LINKED_MESH",
    ),
  ).toBe(true);
});
it("rejects malformed sparse weights and unsafe triangle indices", () => {
  const { mesh } = weightedMeshSkeleton();
  mesh.weightedVertices![0]!.influences[0]!.weight = -1;
  expect(meshAttachmentSchema.safeParse(mesh).success).toBe(false);
  mesh.weightedVertices![0]!.influences[0]!.weight = 1;
  mesh.triangles[0] = Number.MAX_SAFE_INTEGER + 1;
  expect(meshAttachmentSchema.safeParse(mesh).success).toBe(false);
});
