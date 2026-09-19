import { expect, it } from "vitest";
import {
  DeformTimeline,
  type DeformKeyframe,
} from "../../packages/animation/src/index.js";
it("interpolates disjoint sparse ranges with zeros for missing scalars", () => {
  const keys: DeformKeyframe[] = [
    {
      time: 1,
      value: { offset: 0, values: [2, 4] },
      curve: { type: "linear" },
    },
    {
      time: 3,
      value: { offset: 2, values: [6, 8] },
      curve: { type: "linear" },
    },
  ];
  const timeline = new DeformTimeline("mesh", 4, keys),
    out = new Float64Array(4);
  timeline.sampleInto(2, out);
  expect(Array.from(out)).toEqual([1, 2, 3, 4]);
  timeline.sampleInto(0, out);
  expect(Array.from(out)).toEqual([0, 0, 0, 0]);
  timeline.sampleInto(3, out);
  expect(Array.from(out)).toEqual([0, 0, 6, 8]);
  timeline.sampleInto(5, out);
  expect(Array.from(out)).toEqual([0, 0, 6, 8]);
  timeline.sampleInto(1, out);
  expect(Array.from(out)).toEqual([2, 4, 0, 0]);
});
it("honors stepped boundaries and scalar (including odd) offsets", () => {
  const timeline = new DeformTimeline("mesh", 4, [
      {
        time: 0,
        value: { offset: 1, values: [5] },
        curve: { type: "stepped" },
      },
      { time: 1, value: { offset: 3, values: [8] }, curve: { type: "linear" } },
    ]),
    out = new Float32Array(4);
  timeline.sampleInto(0.999, out);
  expect(Array.from(out)).toEqual([0, 5, 0, 0]);
  timeline.sampleInto(1, out);
  expect(Array.from(out)).toEqual([0, 0, 0, 8]);
});
it("copies keys and rejects invalid domains, duplicate keys and overflow", () => {
  const values = [1, 2];
  const key = {
    time: 0,
    value: { offset: 0, values },
    curve: { type: "linear" as const },
  };
  const timeline = new DeformTimeline("mesh", 2, [key]);
  values[0] = 9;
  const out = new Float64Array(2);
  timeline.sampleInto(0, out);
  expect(out[0]).toBe(1);
  expect(() => new DeformTimeline("mesh", 1, [])).toThrow("even");
  expect(() => new DeformTimeline("mesh", 2, [key, key])).toThrow("increasing");
  expect(() => new DeformTimeline("mesh", 0, [key])).toThrow("domain");
  expect(() => timeline.sampleInto(0, new Float64Array(4))).toThrow("length");
  const huge = new DeformTimeline("mesh", 2, [
    { ...key, value: { offset: 0, values: [1e100] } },
  ]);
  const small = new Float32Array(2);
  expect(() => huge.sampleInto(0, small)).toThrow("overflows");
  expect(Array.from(small)).toEqual([0, 0]);
});
