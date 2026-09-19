import { expect, it } from "vitest";
import { MeshInstance } from "../../packages/runtime/src/index.js";
import { DeformTimeline } from "../../packages/animation/src/index.js";
import {
  identityMatrix,
  localToMatrix,
  identityTransform,
} from "../../packages/math/src/index.js";
import { weightedMeshSkeleton } from "../fixtures/canonical/weighted-mesh.js";

it("skins single and two equal influences with independent expected positions", () => {
  const { skeleton } = weightedMeshSkeleton();
  const instance = new MeshInstance(skeleton, "mesh-1");
  const out = instance.evaluate([
    identityMatrix(),
    { ...identityMatrix(), tx: 10 },
  ]);
  expect(Array.from(out)).toEqual([0, 0, 15, 0, 10, 10]);
  expect(instance.evaluate([identityMatrix(), identityMatrix()])).toBe(out);
  expect(Array.from(out)).toEqual([0, 0, 10, 0, 0, 10]);
});
it("derives missing local positions from inverse setup matrices", () => {
  const { skeleton, mesh } = weightedMeshSkeleton();
  skeleton.bones[0]!.setup.x = 5;
  for (const vertex of mesh.weightedVertices!)
    for (const influence of vertex.influences) delete influence.localPosition;
  const instance = new MeshInstance(skeleton, "mesh-1");
  expect(
    Array.from(
      instance.evaluate([
        { ...identityMatrix(), tx: 5 },
        { ...identityMatrix(), tx: 5 },
      ]),
    ),
  ).toEqual([0, 0, 10, 0, 0, 10]);
});
it("applies influence-local deform before weighted rotation and reflection", () => {
  const { skeleton } = weightedMeshSkeleton();
  const instance = new MeshInstance(skeleton, "mesh-1");
  expect(instance.deform.length).toBe(8);
  instance.deform[2] = 2; // first influence of vertex 1, weight .5
  const rotation = localToMatrix({
    ...identityTransform(),
    rotation: Math.PI / 2,
  });
  const result = instance.evaluate([rotation, { ...identityMatrix(), a: -1 }]);
  expect(result[2]).toBeCloseTo(-5);
  expect(result[3]).toBeCloseTo(6);
});
it("maps bind-world vector deformation through inverse bind linear axes", () => {
  const { skeleton, mesh } = weightedMeshSkeleton();
  skeleton.bones[0]!.setup.scaleX = 2;
  for (const vertex of mesh.weightedVertices!)
    for (const influence of vertex.influences) delete influence.localPosition;
  const instance = new MeshInstance(skeleton, "mesh-1", "bindWorld");
  instance.deform[2] = 4;
  const bind = { ...identityMatrix(), a: 2 };
  expect(Array.from(instance.evaluate([bind, bind]))).toEqual([
    0, 0, 14, 0, 0, 10,
  ]);
});
it("evaluates unweighted base plus deform through the slot bone", () => {
  const { skeleton, mesh } = weightedMeshSkeleton();
  mesh.vertices = mesh.weightedVertices!.map((vertex) => vertex.bindPosition);
  delete mesh.weightedVertices;
  const instance = new MeshInstance(skeleton, "mesh-1");
  instance.deform[0] = 3;
  instance.deform[1] = 4;
  expect(
    Array.from(
      instance.evaluate([
        { ...identityMatrix(), a: -1, tx: 2 },
        identityMatrix(),
      ]),
    ),
  ).toEqual([-1, 4, -8, 0, 2, 10]);
});
it("retains authored data and isolates instance buffers", () => {
  const { skeleton } = weightedMeshSkeleton();
  const before = structuredClone(skeleton);
  const a = new MeshInstance(skeleton, "mesh-1"),
    b = new MeshInstance(skeleton, "mesh-1");
  a.deform[0] = 3;
  a.evaluate([identityMatrix(), identityMatrix()]);
  expect(b.deform[0]).toBe(0);
  expect(skeleton).toEqual(before);
  expect(a.worldXY).not.toBe(b.worldXY);
});
it("samples a sparse Bezier timeline into skinning and resets stale deform", () => {
  const { skeleton } = weightedMeshSkeleton();
  const instance = new MeshInstance(skeleton, "mesh-1");
  const timeline = new DeformTimeline("mesh-1", instance.deform.length, [
    {
      time: 0,
      value: { offset: 0, values: [] },
      curve: { type: "bezier", cx1: 0, cy1: 0, cx2: 0, cy2: 1 },
    },
    {
      time: 1,
      value: { offset: 0, values: [10, 0] },
      curve: { type: "linear" },
    },
  ]);
  expect(
    instance.sampleAndEvaluate(
      0.125,
      [identityMatrix(), identityMatrix()],
      timeline,
    )[0],
  ).toBeCloseTo(5);
  expect(
    instance.sampleAndEvaluate(0.5, [identityMatrix(), identityMatrix()])[0],
  ).toBe(0);
});
it.each([true, false])(
  "resolves linked deform ownership when inheritDeform=%s",
  (inheritDeform) => {
    const { skeleton } = weightedMeshSkeleton();
    skeleton.skins[0]!.attachments["slot-1"]!.push({
      type: "mesh",
      id: "linked",
      name: "linked",
      vertices: [],
      uvs: [],
      triangles: [],
      linkedMeshId: "mesh-1",
      inheritDeform,
    });
    const instance = new MeshInstance(skeleton, "linked");
    expect(instance.deformTargetId).toBe(inheritDeform ? "mesh-1" : "linked");
    expect(instance.vertexCount).toBe(3);
    expect(
      Array.from(instance.evaluate([identityMatrix(), identityMatrix()])),
    ).toEqual([0, 0, 10, 0, 0, 10]);
    const wrong = new DeformTimeline("wrong", instance.deform.length, []);
    expect(() =>
      instance.sampleAndEvaluate(
        0,
        [identityMatrix(), identityMatrix()],
        wrong,
      ),
    ).toThrow("target");
  },
);
it("rejects singular implicit binds, invalid poses and Float32 overflow without corrupting published output", () => {
  const { skeleton, mesh } = weightedMeshSkeleton();
  const instance = new MeshInstance(skeleton, "mesh-1");
  instance.evaluate([identityMatrix(), identityMatrix()]);
  const previous = instance.worldXY.slice();
  expect(() => instance.evaluate([])).toThrow("count");
  expect(() =>
    instance.evaluate([{ ...identityMatrix(), a: NaN }, identityMatrix()]),
  ).toThrow("finite");
  expect(() =>
    instance.evaluate([{ ...identityMatrix(), tx: 1e100 }, identityMatrix()]),
  ).toThrow("Float32");
  expect(instance.worldXY).toEqual(previous);
  skeleton.bones[0]!.setup.scaleX = 0;
  delete mesh.weightedVertices![0]!.influences[0]!.localPosition;
  expect(() => new MeshInstance(skeleton, "mesh-1")).toThrow("invert");
});
