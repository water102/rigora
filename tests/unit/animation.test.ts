import { expect, it } from "vitest";
import {
  compileCurve,
  compileNumericTimeline,
  createTimelineCursor,
  resetTimelineCursor,
  animationTime,
  EventTimeline,
  AnimationClock,
  type NumericKeyframe,
} from "../../packages/animation/src/index.js";
const keys = (values: number[]): NumericKeyframe[] =>
  values.map((value, time) => ({ time, value, curve: { type: "linear" } }));

it("samples empty, before-first, exact, interpolated and after-last times", () => {
  expect(compileNumericTimeline([]).sample(0)).toBeUndefined();
  const timeline = compileNumericTimeline(keys([10, 20]));
  expect(timeline.sample(-1)).toBeUndefined();
  expect(timeline.sample(0)).toBe(10);
  expect(timeline.sample(0.5)).toBe(15);
  expect(timeline.sample(1)).toBe(20);
  expect(timeline.sample(100)).toBe(20);
});
it("holds stepped values until the exact next key and copies authored data", () => {
  const frames = keys([10, 20]);
  frames[0]!.curve = { type: "stepped" };
  const timeline = compileNumericTimeline(frames);
  frames[0]!.value = 100;
  expect(timeline.sample(0.99999)).toBe(10);
  expect(timeline.sample(1)).toBe(20);
});
it("cursor agrees with binary search across forward, backward and loop seeks", () => {
  const timeline = compileNumericTimeline(
    keys(Array.from({ length: 100 }, (_, i) => i * i)),
  );
  const cursor = createTimelineCursor();
  for (const time of [-1, 0, 0.5, 30, 90, 4.5, 100, 0, 6.2])
    expect(timeline.sample(time, cursor)).toBe(timeline.sample(time));
  resetTimelineCursor(cursor);
  expect(cursor.timeline).toBeNull();
  expect(timeline.sample(60.4, cursor)).toBe(timeline.sample(60.4));
  expect(compileNumericTimeline(keys([1, 2])).sample(1, cursor)).toBe(2);
});
it("distinguishes shortest rotation from unwrapped spins", () => {
  const radians = Math.PI / 180;
  expect(
    compileNumericTimeline(
      keys([170 * radians, -170 * radians]),
      "shortest",
    ).sample(0.5),
  ).toBeCloseTo(Math.PI);
  expect(
    compileNumericTimeline(keys([0, 4 * Math.PI]), "unwrapped").sample(0.5),
  ).toBeCloseTo(2 * Math.PI);
  expect(
    compileNumericTimeline(keys([0, Math.PI]), "shortest").sample(0.5),
  ).toBeCloseTo(-Math.PI / 2);
});
it("rejects duplicate, descending and nonfinite keys", () => {
  const frames = keys([0, 1]);
  frames[1]!.time = 0;
  expect(() => compileNumericTimeline(frames)).toThrow("strictly increasing");
  expect(() => compileNumericTimeline(keys([0, NaN]))).toThrow("finite");
  expect(() => compileNumericTimeline(keys([0, 1]).reverse())).toThrow(
    "strictly increasing",
  );
});
it("inverts Bezier X with independent analytic expected values", () => {
  // x=t^3; y=3t^2-2t^3.
  const curve = compileCurve({
    type: "bezier",
    cx1: 0,
    cy1: 0,
    cx2: 0,
    cy2: 1,
  });
  expect(curve(0.125)).toBeCloseTo(0.5, 10);
  expect(curve(0)).toBe(0);
  expect(curve(1)).toBe(1);
  expect(curve(1e-9)).toBeCloseTo(3e-6 - 2e-9, 9);
});
it("handles flat derivative, overshoot and invalid handles", () => {
  const flat = compileCurve({ type: "bezier", cx1: 1, cy1: 0, cx2: 0, cy2: 1 });
  expect(flat(0.5)).toBeCloseTo(0.5, 10);
  expect(flat(0.500001)).toBeGreaterThan(0.5);
  expect(
    compileCurve({ type: "bezier", cx1: 1 / 3, cy1: 2, cx2: 2 / 3, cy2: 2 })(
      0.5,
    ),
  ).toBeGreaterThan(1);
  expect(() =>
    compileCurve({ type: "bezier", cx1: -1, cy1: 0, cx2: 1, cy2: 1 }),
  ).toThrow("handles");
  expect(() => compileCurve({ type: "linear" })(NaN)).toThrow("finite");
});
it("loops, clamps and samples zero-duration clips", () => {
  expect(animationTime(2, 2, true)).toBe(0);
  expect(animationTime(-0.5, 2, true)).toBe(1.5);
  expect(animationTime(3, 2, false)).toBe(2);
  expect(animationTime(-1, 2, false)).toBe(0);
  expect(animationTime(5, 0, true)).toBe(0);
});
it("emits exact loop boundaries once in traversal order", () => {
  const events = new EventTimeline(
    [
      { time: 0, value: "start" },
      { time: 0.5, value: "middle" },
      { time: 1, value: "end" },
    ],
    1,
  );
  expect(events.crossed(0, 1, true).map((event) => event.value)).toEqual([
    "middle",
    "end",
    "start",
  ]);
  expect(events.crossed(1, 1, true)).toEqual([]);
  expect(events.crossed(1, 1.5, true).map((event) => event.value)).toEqual([
    "middle",
  ]);
  expect(events.crossed(0, 2, true).map((event) => event.value)).toEqual([
    "middle",
    "end",
    "start",
    "middle",
    "end",
    "start",
  ]);
});
it("partitioning update intervals preserves events and same-time authored order", () => {
  const events = new EventTimeline(
    [
      { time: 0, value: "start" },
      { time: 0.4, value: "a" },
      { time: 0.4, value: "b" },
    ],
    1,
  );
  expect([
    ...events.crossed(0, 1, true),
    ...events.crossed(1, 2.2, true),
  ]).toEqual(events.crossed(0, 2.2, true));
});
it("seek resets baseline, pause emits nothing and nonlooping end clamps", () => {
  const events = new EventTimeline([{ time: 0.5, value: "event" }], 1);
  const clock = new AnimationClock(1, false, events);
  expect(clock.advance(0.5)).toHaveLength(1);
  expect(clock.advance(0)).toEqual([]);
  clock.seek(0.25);
  expect(clock.generation).toBe(1);
  expect(clock.advance(0.25)).toHaveLength(1);
  expect(clock.advance(10)).toEqual([]);
  expect(clock.time).toBe(1);
  expect(clock.advance(1)).toEqual([]);
  expect(() => clock.advance(-1)).toThrow("Negative");
});
it("rejects reverse traversal, invalid durations and oversized catch-up", () => {
  const events = new EventTimeline([{ time: 0, value: 1 }], 1);
  expect(() => events.crossed(1, 0, true)).toThrow("seek");
  expect(() => events.crossed(0, 100002, true)).toThrow("100000");
  expect(() => new AnimationClock(2, true, events)).toThrow("match");
  expect(() => animationTime(0, -1, true)).toThrow("negative");
});
it("copies event payloads and avoids repeated zero-duration events", () => {
  const input = [{ time: 0, value: { name: "original" } }];
  const events = new EventTimeline(input, 0);
  input[0]!.value.name = "modified";
  expect(events.crossed(-1, 0, false)[0]!.value.name).toBe("original");
  const clock = new AnimationClock(0, true, events);
  expect(clock.advance(1)).toEqual([]);
  expect(clock.advance(1)).toEqual([]);
});
