import type { Vec2 } from "@rigora/math";

export type DeformAuthoringMode = "setup" | "animation";
export interface DeformState {
  mode: DeformAuthoringMode;
  offsets: number[];
  keyframes: Map<number, number[]>;
}
export function createDeformState(vertexCount: number): DeformState {
  if (!Number.isInteger(vertexCount) || vertexCount < 0)
    throw new Error("DEFORM_INVALID_VERTEX_COUNT");
  return {
    mode: "setup",
    offsets: new Array(vertexCount * 2).fill(0),
    keyframes: new Map(),
  };
}
export function setDeformMode(
  state: DeformState,
  mode: DeformAuthoringMode,
): DeformState {
  return {
    mode,
    offsets: [...state.offsets],
    keyframes: new Map([...state.keyframes].map(([t, v]) => [t, [...v]])),
  };
}
export function setDeformOffset(
  state: DeformState,
  vertexIndex: number,
  offset: Vec2,
): DeformState {
  const next = setDeformMode(state, state.mode);
  if (vertexIndex < 0 || vertexIndex * 2 + 1 >= next.offsets.length)
    throw new Error("DEFORM_VERTEX_NOT_FOUND");
  next.offsets[vertexIndex * 2] = offset.x;
  next.offsets[vertexIndex * 2 + 1] = offset.y;
  return next;
}
export function zeroDeform(state: DeformState): DeformState {
  return {
    mode: state.mode,
    offsets: new Array(state.offsets.length).fill(0),
    keyframes: new Map([...state.keyframes].map(([t, v]) => [t, [...v]])),
  };
}
export function keyDeform(state: DeformState, time: number): DeformState {
  if (!Number.isFinite(time)) throw new Error("DEFORM_INVALID_TIME");
  const next = setDeformMode(state, "animation");
  next.keyframes.set(time, [...state.offsets]);
  return next;
}
export function sampleDeform(state: DeformState, time: number): number[] {
  const entries = [...state.keyframes.entries()].sort(([a], [b]) => a - b);
  if (!entries.length) return [...state.offsets];
  const before = entries.filter(([t]) => t <= time).at(-1) ?? entries[0]!;
  const after = entries.find(([t]) => t >= time) ?? entries.at(-1)!;
  if (before[0] === after[0]) return [...before[1]];
  const u = (time - before[0]) / (after[0] - before[0]);
  return before[1].map((v, i) => v + (after[1][i]! - v) * u);
}
export function inheritLinkedDeform(
  base: readonly number[],
  linked: readonly number[],
  inherit: boolean,
): number[] {
  if (base.length !== linked.length) throw new Error("DEFORM_DOMAIN_MISMATCH");
  return (inherit ? base : linked).slice();
}
