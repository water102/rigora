import { MeshInstance } from "../packages/runtime/dist/index.js";
import {
  identityMatrix,
  identityTransform,
} from "../packages/math/dist/index.js";
const count = 10000;
const mesh = {
  type: "mesh",
  id: "mesh",
  name: "benchmark",
  vertices: [],
  triangles: [],
  uvs: Array.from({ length: count }, () => ({ x: 0, y: 0 })),
  weightedVertices: Array.from({ length: count }, (_, i) => ({
    bindPosition: { x: i % 100, y: Math.floor(i / 100) },
    influences: ["a", "b"].map((boneId) => ({
      boneId,
      weight: 0.5,
      localPosition: { x: i % 100, y: Math.floor(i / 100) },
    })),
  })),
};
const skeleton = {
  id: "skeleton",
  name: "benchmark",
  coordinateSystem: "x-right-y-up-ccw-radians",
  fps: 30,
  bones: ["a", "b"].map((id) => ({
    id,
    name: id,
    setup: identityTransform(),
    length: 1,
    inherit: "normal",
  })),
  slots: [
    {
      id: "slot",
      name: "slot",
      boneId: "a",
      setupAttachmentId: "mesh",
      color: { r: 1, g: 1, b: 1, a: 1 },
      blendMode: "normal",
      zIndex: 0,
    },
  ],
  skins: [{ id: "skin", name: "default", attachments: { slot: [mesh] } }],
  constraints: [],
  animations: [],
  events: [],
};
const instance = new MeshInstance(skeleton, "mesh");
const pose = [identityMatrix(), { ...identityMatrix(), tx: 10 }];
for (let i = 0; i < 100; i++) instance.evaluate(pose);
const frames = 500,
  start = performance.now();
for (let i = 0; i < frames; i++) {
  pose[1].ty = i % 10;
  instance.evaluate(pose);
}
const elapsed = performance.now() - start;
console.log(
  JSON.stringify(
    {
      node: process.version,
      vertices: count,
      influences: count * 2,
      frames,
      millisecondsPerFrame: elapsed / frames,
      outputBytes: instance.worldXY.byteLength,
      checksum: instance.worldXY[0] + instance.worldXY.at(-1),
    },
    null,
    2,
  ),
);
