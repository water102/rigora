export type CurveSpec =
  | { type: "linear" }
  | { type: "stepped" }
  | { type: "bezier"; cx1: number; cy1: number; cx2: number; cy2: number };
export interface NumericKeyframe {
  time: number;
  value: number;
  curve: CurveSpec;
}
export type RotationPolicy = "shortest" | "unwrapped";
export class AnimationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AnimationError";
  }
}

export interface DeformKeyframe {
  time: number;
  value: { offset: number; values: readonly number[] };
  curve: CurveSpec;
}

/** Sparse offsets are scalar offsets (x,y,x,y), not vertex indices. */
export class DeformTimeline {
  readonly #times: Float64Array;
  readonly #offsets: number[];
  readonly #values: Float64Array[];
  readonly #curves: ((progress: number) => number)[];
  constructor(
    readonly targetId: string,
    readonly scalarCount: number,
    keys: readonly DeformKeyframe[],
  ) {
    if (
      !targetId ||
      !Number.isSafeInteger(scalarCount) ||
      scalarCount < 0 ||
      scalarCount % 2 !== 0
    )
      throw new AnimationError(
        "ANIMATION_INVALID_DEFORM",
        "Deform requires a target and an even nonnegative scalar count.",
      );
    keys.forEach((key, i) => {
      requireFinite(key.time);
      if (key.time < 0 || (i > 0 && key.time <= keys[i - 1]!.time))
        throw new AnimationError(
          "ANIMATION_INVALID_KEYS",
          "Deform times must be strictly increasing and nonnegative.",
        );
      if (
        !Number.isSafeInteger(key.value.offset) ||
        key.value.offset < 0 ||
        key.value.offset + key.value.values.length > scalarCount
      )
        throw new AnimationError(
          "ANIMATION_INVALID_DEFORM",
          "Sparse deform exceeds the scalar domain.",
        );
      for (const value of key.value.values) requireFinite(value);
    });
    this.#times = Float64Array.from(keys, (key) => key.time);
    this.#offsets = keys.map((key) => key.value.offset);
    this.#values = keys.map((key) => Float64Array.from(key.value.values));
    this.#curves = keys.map((key) => compileCurve(key.curve));
  }
  /** Fully overwrites caller-owned buffer; missing scalars and pre-first times are zero. */
  sampleInto(time: number, out: Float32Array | Float64Array): void {
    requireFinite(time);
    if (out.length !== this.scalarCount)
      throw new AnimationError(
        "ANIMATION_INVALID_DEFORM",
        "Deform output length mismatch.",
      );
    let low = 0,
      high = this.#times.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.#times[mid]! <= time) low = mid + 1;
      else high = mid;
    }
    const index = low - 1;
    out.fill(0);
    if (index < 0) return;
    const start = this.#values[index]!,
      offset = this.#offsets[index]!;
    const next = index + 1;
    if (next === this.#times.length || time === this.#times[index])
      out.set(start, offset);
    else {
      const alpha = this.#curves[index]!(
        (time - this.#times[index]!) /
          (this.#times[next]! - this.#times[index]!),
      );
      for (let i = 0; i < start.length; i++)
        out[offset + i] = start[i]! * (1 - alpha);
      const end = this.#values[next]!,
        endOffset = this.#offsets[next]!;
      for (let i = 0; i < end.length; i++)
        out[endOffset + i] = out[endOffset + i]! + end[i]! * alpha;
    }
    for (let i = 0; i < out.length; i++)
      if (!Number.isFinite(out[i])) {
        out.fill(0);
        throw new AnimationError(
          "ANIMATION_NON_FINITE",
          "Deform sample overflows its output buffer.",
        );
      }
  }
}
function requireFinite(...values: number[]): void {
  if (!values.every(Number.isFinite))
    throw new AnimationError(
      "ANIMATION_NON_FINITE",
      "Animation values must be finite.",
    );
}
function validateCurve(curve: CurveSpec): void {
  if (curve.type === "bezier") {
    requireFinite(curve.cx1, curve.cy1, curve.cx2, curve.cy2);
    if (curve.cx1 < 0 || curve.cx1 > 1 || curve.cx2 < 0 || curve.cx2 > 1)
      throw new AnimationError(
        "ANIMATION_INVALID_CURVE",
        "Bezier X handles must be in [0, 1].",
      );
  } else if (curve.type !== "linear" && curve.type !== "stepped")
    throw new AnimationError("ANIMATION_INVALID_CURVE", "Unsupported curve.");
}
const cubic = (t: number, p1: number, p2: number) =>
  3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3;
const derivative = (t: number, p1: number, p2: number) =>
  3 * (1 - t) ** 2 * p1 + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (1 - p2);

/** Compiles a 16-interval X lookup table; returned evaluator allocates nothing. */
export function compileCurve(curve: CurveSpec): (progress: number) => number {
  validateCurve(curve);
  if (curve.type === "linear")
    return (x) => {
      requireFinite(x);
      return Math.max(0, Math.min(1, x));
    };
  if (curve.type === "stepped")
    return (x) => {
      requireFinite(x);
      return x >= 1 ? 1 : 0;
    };
  const { cx1, cy1, cx2, cy2 } = curve;
  const lut = Float64Array.from({ length: 17 }, (_, i) =>
    cubic(i / 16, cx1, cx2),
  );
  return (x) => {
    requireFinite(x);
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let interval = 0;
    while (interval < 15 && lut[interval + 1]! < x) interval++;
    if (lut[interval + 1] === x) return cubic((interval + 1) / 16, cy1, cy2);
    let low = interval / 16,
      high = (interval + 1) / 16;
    let t = (low + high) / 2;
    for (let i = 0; i < 50; i++) {
      const delta = cubic(t, cx1, cx2) - x;
      if (high - low < 1e-13) break;
      if (delta < 0) low = t;
      else high = t;
      const slope = derivative(t, cx1, cx2);
      const candidate = slope > 1e-10 ? t - delta / slope : NaN;
      t = candidate > low && candidate < high ? candidate : (low + high) / 2;
    }
    const result = cubic(t, cy1, cy2);
    requireFinite(result);
    return result;
  };
}

export interface TimelineCursor {
  index: number;
  time: number;
  timeline: NumericTimeline | null;
}
export const createTimelineCursor = (): TimelineCursor => ({
  index: -1,
  time: -Infinity,
  timeline: null,
});
export function resetTimelineCursor(cursor: TimelineCursor): void {
  cursor.index = -1;
  cursor.time = -Infinity;
  cursor.timeline = null;
}

/** Compiled data is private, copied from authored keys, and never mutated by sampling. */
export class NumericTimeline {
  readonly #times: Float64Array;
  readonly #values: Float64Array;
  readonly #curves: ((progress: number) => number)[];
  constructor(
    keys: readonly NumericKeyframe[],
    readonly rotationPolicy?: RotationPolicy,
  ) {
    if (
      rotationPolicy !== undefined &&
      rotationPolicy !== "shortest" &&
      rotationPolicy !== "unwrapped"
    )
      throw new AnimationError(
        "ANIMATION_INVALID_ROTATION_POLICY",
        "Unknown rotation interpolation policy.",
      );
    keys.forEach((key, i) => {
      requireFinite(key.time, key.value);
      if (key.time < 0 || (i > 0 && key.time <= keys[i - 1]!.time))
        throw new AnimationError(
          "ANIMATION_INVALID_KEYS",
          "Numeric key times must be nonnegative and strictly increasing.",
        );
    });
    this.#times = Float64Array.from(keys, (key) => key.time);
    this.#values = Float64Array.from(keys, (key) => key.value);
    this.#curves = keys.map((key) => compileCurve(key.curve));
  }
  /** Before first key returns undefined, allowing the caller to retain setup pose. */
  sample(time: number, cursor?: TimelineCursor): number | undefined {
    requireFinite(time);
    let index: number;
    if (cursor?.timeline === this && time >= cursor.time) {
      index = cursor.index;
      while (index + 1 < this.#times.length && this.#times[index + 1]! <= time)
        index++;
    } else {
      let low = 0,
        high = this.#times.length;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (this.#times[mid]! <= time) low = mid + 1;
        else high = mid;
      }
      index = low - 1;
    }
    if (cursor) {
      cursor.timeline = this;
      cursor.time = time;
      cursor.index = index;
    }
    if (index < 0) return undefined;
    const start = this.#values[index]!;
    if (index + 1 === this.#times.length || time === this.#times[index])
      return start;
    let delta = this.#values[index + 1]! - start;
    if (this.rotationPolicy === "shortest") {
      const tau = Math.PI * 2;
      delta = ((((delta + Math.PI) % tau) + tau) % tau) - Math.PI;
    }
    const alpha =
      (time - this.#times[index]!) /
      (this.#times[index + 1]! - this.#times[index]!);
    const result = start + delta * this.#curves[index]!(alpha);
    requireFinite(result);
    return result;
  }
}
export const compileNumericTimeline = (
  keys: readonly NumericKeyframe[],
  rotationPolicy?: RotationPolicy,
): NumericTimeline => new NumericTimeline(keys, rotationPolicy);

export function animationTime(
  time: number,
  duration: number,
  loop: boolean,
): number {
  requireFinite(time, duration);
  if (duration < 0)
    throw new AnimationError(
      "ANIMATION_INVALID_DURATION",
      "Duration cannot be negative.",
    );
  if (duration === 0) return 0;
  return loop
    ? ((time % duration) + duration) % duration
    : Math.max(0, Math.min(duration, time));
}

export interface EventKey<T> {
  time: number;
  value: T;
}
export interface EventOccurrence<T> {
  absoluteTime: number;
  keyIndex: number;
  value: T;
}

/** Events at duration and zero are distinct authored events at the same loop boundary. */
export class EventTimeline<T> {
  readonly #keys: EventKey<T>[];
  constructor(
    keys: readonly EventKey<T>[],
    readonly duration: number,
  ) {
    requireFinite(duration);
    if (duration < 0)
      throw new AnimationError(
        "ANIMATION_INVALID_DURATION",
        "Duration cannot be negative.",
      );
    keys.forEach((key, i) => {
      requireFinite(key.time);
      if (
        key.time < 0 ||
        key.time > duration ||
        (i > 0 && key.time < keys[i - 1]!.time)
      )
        throw new AnimationError(
          "ANIMATION_INVALID_EVENTS",
          "Events must be ordered within duration.",
        );
    });
    this.#keys = structuredClone([...keys]);
  }
  /** Forward (previous, current]; paused intervals emit nothing; reverse is explicit error. */
  crossed(
    previous: number,
    current: number,
    loop: boolean,
  ): EventOccurrence<T>[] {
    requireFinite(previous, current);
    if (current < previous)
      throw new AnimationError(
        "ANIMATION_REVERSE_UNSUPPORTED",
        "Use seek to move backwards without emitting events.",
      );
    const result: EventOccurrence<T>[] = [];
    if (current === previous || this.#keys.length === 0) return result;
    const repeating = loop && this.duration > 0;
    const first = repeating
      ? Math.max(0, Math.floor(previous / this.duration) - 1)
      : 0;
    const last = repeating
      ? Math.max(0, Math.floor(current / this.duration))
      : 0;
    if (!Number.isSafeInteger(last) || last - first > 100000)
      throw new AnimationError(
        "ANIMATION_EVENT_LIMIT",
        "Event traversal exceeds 100000 loops; advance in smaller steps.",
      );
    for (let cycle = first; cycle <= last; cycle++) {
      this.#keys.forEach((key, keyIndex) => {
        const absoluteTime = cycle * this.duration + key.time;
        if (absoluteTime > previous && absoluteTime <= current)
          result.push({
            absoluteTime,
            keyIndex,
            value: structuredClone(key.value),
          });
      });
    }
    return result;
  }
}

/** Clock owns event baseline and seek invalidation; sampling remains caller-owned. */
export class AnimationClock<T> {
  #time = 0;
  #generation = 0;
  constructor(
    readonly duration: number,
    readonly loop: boolean,
    readonly events?: EventTimeline<T>,
  ) {
    animationTime(0, duration, loop);
    if (events && events.duration !== duration)
      throw new AnimationError(
        "ANIMATION_INVALID_DURATION",
        "Event and clock duration must match.",
      );
  }
  get time(): number {
    return animationTime(this.#time, this.duration, this.loop);
  }
  get absoluteTime(): number {
    return this.#time;
  }
  get generation(): number {
    return this.#generation;
  }
  seek(time: number): void {
    requireFinite(time);
    this.#time = this.loop
      ? Math.max(0, time)
      : animationTime(time, this.duration, false);
    this.#generation++;
  }
  advance(delta: number): EventOccurrence<T>[] {
    requireFinite(delta);
    if (delta < 0)
      throw new AnimationError(
        "ANIMATION_REVERSE_UNSUPPORTED",
        "Negative playback delta is unsupported; use seek.",
      );
    const next = this.#time + delta;
    requireFinite(next);
    const target = this.loop ? next : Math.min(this.duration, next);
    const result = this.events?.crossed(this.#time, target, this.loop) ?? [];
    this.#time = target;
    return result;
  }
}

export type AuthoringChannelKind =
  | "bone"
  | "slot"
  | "constraint"
  | "deform"
  | "event";
export type SlotProperty = "attachment" | "color" | "twoColor" | "drawOrder";
export type ConstraintProperty =
  | "ikMix"
  | "transformMix"
  | "pathPosition"
  | "pathSpacing"
  | "physics";
export type AutoKeyMode = "off" | "changed-property" | "first-frame";

export interface AuthoredKey<T = unknown> {
  id: string;
  time: number;
  value: T;
  curve: CurveSpec;
}
export interface AuthoringChannel<T = unknown> {
  id: string;
  kind: AuthoringChannelKind;
  targetId?: string;
  property: string;
  keys: AuthoredKey<T>[];
}

export function createSlotChannel<T>(
  id: string,
  slotId: string,
  property: SlotProperty,
): AuthoringChannel<T> {
  if (!id || !slotId) throw new Error("ANIMATION_AUTHORING_INVALID_CHANNEL");
  return { id, kind: "slot", targetId: slotId, property, keys: [] };
}

export function createConstraintChannel<T>(
  id: string,
  constraintId: string,
  property: ConstraintProperty,
): AuthoringChannel<T> {
  if (!id || !constraintId)
    throw new Error("ANIMATION_AUTHORING_INVALID_CHANNEL");
  return { id, kind: "constraint", targetId: constraintId, property, keys: [] };
}

export function validateChannelValue(
  channel: Pick<AuthoringChannel, "kind" | "property">,
  value: unknown,
): void {
  if (channel.kind === "slot" && channel.property === "drawOrder") {
    if (!Number.isSafeInteger(value))
      throw new Error("ANIMATION_AUTHORING_INVALID_DRAW_ORDER");
  } else if (channel.kind === "slot" && channel.property === "attachment") {
    if (typeof value !== "string")
      throw new Error("ANIMATION_AUTHORING_INVALID_ATTACHMENT");
  } else if (
    channel.kind === "slot" &&
    (channel.property === "color" || channel.property === "twoColor")
  ) {
    if (typeof value !== "string" || !/^[0-9a-fA-F]{6,8}$/.test(value))
      throw new Error("ANIMATION_AUTHORING_INVALID_COLOR");
  } else if (channel.kind === "constraint" && typeof value !== "number") {
    throw new Error("ANIMATION_AUTHORING_INVALID_CONSTRAINT_VALUE");
  }
}
export interface AnimationClip {
  id: string;
  name: string;
  duration: number;
  fps: number;
  channels: AuthoringChannel[];
}

export interface CanonicalTimelineSnapshot {
  id: string;
  type: string;
  targetId?: string;
  keyframes: Array<{ time: number; value: unknown; curve: CurveSpec }>;
}

export interface CanonicalAnimationSnapshot {
  id: string;
  name: string;
  duration: number;
  timelines: CanonicalTimelineSnapshot[];
}

export function toCanonicalAnimation(
  clip: AnimationClip,
): CanonicalAnimationSnapshot {
  return {
    id: clip.id,
    name: clip.name,
    duration: clip.duration,
    timelines: clip.channels.map((channel) => ({
      id: channel.id,
      type: `${channel.kind}.${channel.property}`,
      ...(channel.targetId === undefined ? {} : { targetId: channel.targetId }),
      keyframes: channel.keys.map((key) => ({
        time: key.time,
        value: cloneAuthoring(key.value),
        curve: key.curve,
      })),
    })),
  };
}

export function fromCanonicalAnimation(
  animation: CanonicalAnimationSnapshot,
  fps: number,
): AnimationClip {
  finiteAuthoring(fps, "fps");
  if (fps <= 0 || animation.duration < 0)
    throw new Error("ANIMATION_AUTHORING_INVALID_CLIP");
  return {
    id: animation.id,
    name: animation.name,
    duration: animation.duration,
    fps,
    channels: animation.timelines.map((timeline) => {
      const separator = timeline.type.indexOf(".");
      const kind = (
        separator < 0 ? timeline.type : timeline.type.slice(0, separator)
      ) as AuthoringChannelKind;
      const property =
        separator < 0 ? timeline.type : timeline.type.slice(separator + 1);
      return {
        id: timeline.id,
        kind,
        ...(timeline.targetId === undefined
          ? {}
          : { targetId: timeline.targetId }),
        property,
        keys: timeline.keyframes.map((key, index) => ({
          id: `${timeline.id}:key:${index}`,
          time: key.time,
          value: cloneAuthoring(key.value),
          curve: key.curve,
        })),
      };
    }),
  };
}
export interface TimelineRow {
  id: string;
  label: string;
  channelId?: string;
  children?: TimelineRow[];
}

export interface VirtualRowWindow<T> {
  items: readonly T[];
  start: number;
  end: number;
  offsetTop: number;
  totalHeight: number;
}

export function virtualizeRows<T>(
  rows: readonly T[],
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  overscan = 4,
): VirtualRowWindow<T> {
  if (
    ![scrollTop, viewportHeight, rowHeight, overscan].every(Number.isFinite) ||
    viewportHeight < 0 ||
    rowHeight <= 0 ||
    overscan < 0
  )
    throw new Error("ANIMATION_AUTHORING_INVALID_VIRTUAL_WINDOW");
  const first = Math.max(
    0,
    Math.floor(scrollTop / rowHeight) - Math.floor(overscan),
  );
  const last = Math.min(
    rows.length,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + Math.ceil(overscan),
  );
  return {
    items: rows.slice(first, last),
    start: first,
    end: last,
    offsetTop: first * rowHeight,
    totalHeight: rows.length * rowHeight,
  };
}
export interface TimelineViewModel {
  rows: TimelineRow[];
  selectedKeyIds: ReadonlySet<string>;
  playhead: number;
  visibleStart: number;
  visibleEnd: number;
  zoom: number;
  markers: readonly TimelineMarker[];
  loop: { start: number; end: number; enabled: boolean };
}
export interface TimelineMarker {
  id: string;
  time: number;
  label?: string;
  color?: string;
}

export interface GraphRange {
  start: number;
  end: number;
  valueMin: number;
  valueMax: number;
}

export function fitGraphRange(
  keys: readonly AuthoredKey<number>[],
  selectedIds?: readonly string[],
  padding = 0.05,
): GraphRange {
  const selected = selectedIds ? new Set(selectedIds) : undefined;
  const source = keys.filter((key) => !selected || selected.has(key.id));
  if (!source.length) throw new Error("ANIMATION_AUTHORING_NO_GRAPH_KEYS");
  const times = source.map((key) => key.time);
  const values = source.map((key) => key.value);
  const timeSpan = Math.max(Math.max(...times) - Math.min(...times), 1 / 60);
  const valueSpan = Math.max(Math.max(...values) - Math.min(...values), 1);
  return {
    start: Math.min(...times) - timeSpan * padding,
    end: Math.max(...times) + timeSpan * padding,
    valueMin: Math.min(...values) - valueSpan * padding,
    valueMax: Math.max(...values) + valueSpan * padding,
  };
}

export function scaleKeyTimes(
  keys: readonly AuthoredKey[],
  keyIds: readonly string[],
  pivot: number,
  factor: number,
  duration: number,
): AuthoredKey[] {
  finiteAuthoring(pivot, "pivot");
  finiteAuthoring(factor, "factor");
  if (factor < 0) throw new Error("ANIMATION_AUTHORING_INVALID_TIME_SCALE");
  const ids = new Set(keyIds);
  return keys.map((key) => {
    if (!ids.has(key.id)) return cloneAuthoring(key);
    const time = pivot + (key.time - pivot) * factor;
    assertTime(time, duration);
    return { ...cloneAuthoring(key), time };
  });
}

export interface KeyClipboard {
  sourceChannelId: string;
  origin: number;
  keys: readonly AuthoredKey[];
}

export function copyKeys(
  channel: AuthoringChannel,
  keyIds: readonly string[],
): KeyClipboard {
  const ids = new Set(keyIds);
  const keys = channel.keys
    .filter((key) => ids.has(key.id))
    .map(cloneAuthoring);
  if (!keys.length) throw new Error("ANIMATION_AUTHORING_NO_SELECTED_KEYS");
  return {
    sourceChannelId: channel.id,
    origin: Math.min(...keys.map((key) => key.time)),
    keys,
  };
}

export function pasteKeys(
  clipboard: KeyClipboard,
  channel: AuthoringChannel,
  at: number,
  duration: number,
  idFactory: (prefix: string) => string,
): AuthoredKey[] {
  assertTime(at, duration);
  const pasted = clipboard.keys.map((key) => {
    const time = at + key.time - clipboard.origin;
    assertTime(time, duration);
    return { ...cloneAuthoring(key), id: idFactory("key"), time };
  });
  channel.keys.push(...pasted);
  channel.keys.sort((a, b) => a.time - b.time);
  return cloneAuthoring(pasted);
}

export interface EventPreviewEntry<T = unknown> {
  time: number;
  name: string;
  payload?: T;
}

export interface EventDefinition {
  id: string;
  name: string;
  payloadSchema?: unknown;
}

export class EventAuthoringTrack<T = unknown> {
  #events: AuthoredEvent[] = [];
  constructor(
    readonly duration: number,
    readonly definitions: EventDefinition[] = [],
  ) {
    if (!Number.isFinite(duration) || duration < 0)
      throw new Error("ANIMATION_AUTHORING_INVALID_DURATION");
  }
  get events(): readonly AuthoredEvent[] {
    return cloneAuthoring(this.#events);
  }
  addDefinition(definition: EventDefinition): void {
    if (
      !definition.id ||
      !definition.name ||
      this.definitions.some((item) => item.id === definition.id)
    )
      throw new Error("ANIMATION_AUTHORING_INVALID_EVENT_DEFINITION");
    this.definitions.push(cloneAuthoring(definition));
  }
  upsert(id: string, time: number, name: string, payload?: T): AuthoredEvent {
    assertTime(time, this.duration);
    if (!name.trim()) throw new Error("ANIMATION_AUTHORING_INVALID_EVENT_NAME");
    const existing = this.#events.find((event) => event.id === id);
    const event = existing ?? { id, time, name, payload };
    event.time = time;
    event.name = name;
    if (payload !== undefined) event.payload = cloneAuthoring(payload);
    if (!existing) this.#events.push(event);
    this.#events.sort((a, b) => a.time - b.time);
    return cloneAuthoring(event);
  }
  remove(id: string): void {
    this.#events = this.#events.filter((event) => event.id !== id);
  }
  preview(
    previous: number,
    current: number,
    loop = false,
  ): EventOccurrence<T>[] {
    if (current < previous)
      throw new Error("ANIMATION_AUTHORING_REVERSE_PREVIEW");
    const crossed = (
      start: number,
      end: number,
      offset: number,
    ): EventOccurrence<T>[] =>
      this.#events
        .map((event, keyIndex) => ({ event, keyIndex }))
        .filter(({ event }) => event.time > start && event.time <= end)
        .map(({ event, keyIndex }) => ({
          absoluteTime: offset + event.time,
          keyIndex,
          value: cloneAuthoring(event.payload as T),
        }));
    if (loop && this.duration > 0 && current >= this.duration)
      return [
        ...crossed(previous, this.duration, 0),
        ...crossed(-1, current % this.duration, this.duration),
      ];
    return crossed(previous, current, 0);
  }
}

export function previewEvents<T>(
  events: readonly EventPreviewEntry<T>[],
  time: number,
): EventPreviewEntry<T>[] {
  finiteAuthoring(time, "time");
  return events.filter((event) => event.time <= time).map(cloneAuthoring);
}

export interface AuthoringBenchmarkResult {
  keyCount: number;
  selectMs: number;
  moveMs: number;
  selectedCount: number;
  usable: boolean;
}

/** Lightweight deterministic stress probe for the timeline hot paths. */
export function benchmarkAuthoringKeys(
  keyCount: number,
): AuthoringBenchmarkResult {
  if (!Number.isSafeInteger(keyCount) || keyCount < 0)
    throw new Error("ANIMATION_AUTHORING_INVALID_BENCHMARK_SIZE");
  const channel: AuthoringChannel<number> = {
    id: "benchmark",
    kind: "bone",
    property: "rotate",
    keys: [],
  };
  for (let index = 0; index < keyCount; index++) {
    channel.keys.push({
      id: `key-${index}`,
      time: index / 60,
      value: index,
      curve: { type: "linear" },
    });
  }
  const startSelect = performance.now();
  const selected = channel.keys.filter(
    (key) => key.time >= 0 && key.time <= keyCount / 120,
  );
  const selectMs = performance.now() - startSelect;
  const startMove = performance.now();
  for (const key of selected) key.time += 1 / 60;
  const moveMs = performance.now() - startMove;
  return {
    keyCount,
    selectMs,
    moveMs,
    selectedCount: selected.length,
    usable: selected.length > 0 && Number.isFinite(selectMs + moveMs),
  };
}

export interface AuthoringCommand {
  label: string;
  do(): void;
  undo(): void;
}

export class AuthoringHistory {
  #undo: AuthoringCommand[] = [];
  #redo: AuthoringCommand[] = [];
  #transaction: AuthoringCommand[] | null = null;

  get canUndo(): boolean {
    return this.#undo.length > 0;
  }
  get canRedo(): boolean {
    return this.#redo.length > 0;
  }
  execute(command: AuthoringCommand): void {
    command.do();
    if (this.#transaction) this.#transaction.push(command);
    else this.#undo.push(command);
    this.#redo = [];
  }
  begin(label = "Transaction"): void {
    if (this.#transaction)
      throw new Error("ANIMATION_AUTHORING_TRANSACTION_NESTED");
    this.#transaction = [];
    this.#transaction.push({ label, do() {}, undo() {} });
  }
  commit(): void {
    if (!this.#transaction)
      throw new Error("ANIMATION_AUTHORING_TRANSACTION_MISSING");
    const [header, ...commands] = this.#transaction;
    this.#transaction = null;
    if (!commands.length) return;
    this.#undo.push({
      label: header!.label,
      do() {
        commands.forEach((command) => command.do());
      },
      undo() {
        [...commands].reverse().forEach((command) => command.undo());
      },
    });
  }
  cancel(): void {
    if (!this.#transaction)
      throw new Error("ANIMATION_AUTHORING_TRANSACTION_MISSING");
    const [, ...commands] = this.#transaction;
    this.#transaction = null;
    [...commands].reverse().forEach((command) => command.undo());
  }
  undo(): void {
    const command = this.#undo.pop();
    if (!command) return;
    command.undo();
    this.#redo.push(command);
  }
  redo(): void {
    const command = this.#redo.pop();
    if (!command) return;
    command.do();
    this.#undo.push(command);
  }
}

export interface AutoKeyRequest<T> {
  channel: AuthoringChannel<T>;
  time: number;
  value: T;
  mode: AutoKeyMode;
  propertyChanged: boolean;
  isFirstFrame: boolean;
  curve?: CurveSpec;
  idFactory: (prefix: string) => string;
}

/** Applies the policy only; the returned key can be sent through the normal history command. */
export function createAutoKey<T>(
  request: AutoKeyRequest<T>,
): AuthoredKey<T> | undefined {
  const shouldCreate =
    request.mode === "changed-property"
      ? request.propertyChanged
      : request.mode === "first-frame"
        ? request.isFirstFrame
        : false;
  if (!shouldCreate) return undefined;
  const existing = request.channel.keys.find(
    (key) => key.time === request.time,
  );
  return {
    id: existing?.id ?? request.idFactory("key"),
    time: request.time,
    value: cloneAuthoring(request.value),
    curve: request.curve ?? existing?.curve ?? { type: "linear" },
  };
}

export function applyAutoKey<T>(
  request: AutoKeyRequest<T>,
): AuthoredKey<T> | undefined {
  const key = createAutoKey(request);
  if (!key) return undefined;
  const index = request.channel.keys.findIndex((item) => item.id === key.id);
  if (index >= 0) request.channel.keys[index] = key;
  else request.channel.keys.push(key);
  request.channel.keys.sort((a, b) => a.time - b.time);
  return cloneAuthoring(key);
}

function finiteAuthoring(value: number, name: string): void {
  if (!Number.isFinite(value))
    throw new Error(`ANIMATION_AUTHORING_INVALID_${name.toUpperCase()}`);
}
function cloneAuthoring<T>(value: T): T {
  return structuredClone(value);
}
function assertTime(time: number, duration: number): void {
  finiteAuthoring(time, "time");
  if (time < 0 || time > duration)
    throw new Error("ANIMATION_AUTHORING_TIME_OUT_OF_RANGE");
}

export class AnimationAuthoringStore {
  #clips: AnimationClip[] = [];
  #activeId: string | null = null;
  #sequence = 0;
  readonly view: TimelineViewModel = {
    rows: [],
    selectedKeyIds: new Set(),
    playhead: 0,
    visibleStart: 0,
    visibleEnd: 1,
    zoom: 1,
    markers: [],
    loop: { start: 0, end: 1, enabled: false },
  };
  get clips(): readonly AnimationClip[] {
    return this.#clips.map(cloneAuthoring);
  }
  get active(): AnimationClip | undefined {
    const clip = this.#clips.find((item) => item.id === this.#activeId);
    return clip && cloneAuthoring(clip);
  }
  importClip(snapshot: CanonicalAnimationSnapshot, fps: number): AnimationClip {
    const clip = fromCanonicalAnimation(snapshot, fps);
    const existing = this.#clips.findIndex((item) => item.id === clip.id);
    if (existing >= 0) this.#clips[existing] = clip;
    else this.#clips.push(clip);
    this.#activeId = clip.id;
    this.syncRows();
    this.setRange(0, clip.duration || 1);
    return cloneAuthoring(clip);
  }
  exportActive(): CanonicalAnimationSnapshot {
    return toCanonicalAnimation(this.activeMutable());
  }
  create(
    name: string,
    duration = 1,
    fps = 30,
    id = this.nextId("animation"),
  ): AnimationClip {
    if (!name.trim() || duration < 0 || fps <= 0)
      throw new Error("ANIMATION_AUTHORING_INVALID_CLIP");
    finiteAuthoring(duration, "duration");
    finiteAuthoring(fps, "fps");
    const clip = { id, name, duration, fps, channels: [] };
    this.#clips.push(clip);
    this.#activeId = id;
    this.setRange(0, duration || 1);
    return cloneAuthoring(clip);
  }
  rename(id: string, name: string): void {
    const clip = this.require(id);
    if (!name.trim()) throw new Error("ANIMATION_AUTHORING_INVALID_NAME");
    clip.name = name;
  }
  setMetadata(id: string, metadata: { duration?: number; fps?: number }): void {
    const clip = this.require(id);
    if (metadata.duration !== undefined) {
      finiteAuthoring(metadata.duration, "duration");
      if (metadata.duration < 0)
        throw new Error("ANIMATION_AUTHORING_INVALID_DURATION");
      clip.duration = metadata.duration;
    }
    if (metadata.fps !== undefined) {
      finiteAuthoring(metadata.fps, "fps");
      if (metadata.fps <= 0) throw new Error("ANIMATION_AUTHORING_INVALID_FPS");
      clip.fps = metadata.fps;
    }
  }
  duplicate(id: string, newId = this.nextId("animation")): AnimationClip {
    const copy = cloneAuthoring(this.require(id));
    copy.id = newId;
    copy.name = `${copy.name} copy`;
    copy.channels = copy.channels.map((channel) => ({
      ...channel,
      id: this.nextId(channel.id),
      keys: channel.keys.map((key) => ({ ...key, id: this.nextId(key.id) })),
    }));
    this.#clips.push(copy);
    return cloneAuthoring(copy);
  }
  delete(id: string): void {
    const index = this.#clips.findIndex((clip) => clip.id === id);
    if (index < 0) throw new Error("ANIMATION_AUTHORING_NOT_FOUND");
    this.#clips.splice(index, 1);
    if (this.#activeId === id) this.#activeId = this.#clips[0]?.id ?? null;
  }
  select(id: string): void {
    this.require(id);
    this.#activeId = id;
  }
  addChannel(
    channel: Omit<AuthoringChannel, "keys"> & { keys?: readonly AuthoredKey[] },
  ): AuthoringChannel {
    const clip = this.activeMutable();
    const result: AuthoringChannel = {
      ...channel,
      keys: [...(channel.keys ?? [])].map(cloneAuthoring),
    };
    clip.channels.push(result);
    return cloneAuthoring(result);
  }
  upsertKey<T>(
    channelId: string,
    time: number,
    value: T,
    curve: CurveSpec = { type: "linear" },
    id = this.nextId("key"),
  ): AuthoredKey<T> {
    const clip = this.activeMutable();
    assertTime(time, clip.duration);
    const channel = clip.channels.find((item) => item.id === channelId);
    if (!channel) throw new Error("ANIMATION_AUTHORING_CHANNEL_NOT_FOUND");
    const existing = channel.keys.find((key) => key.time === time);
    const key = existing ?? {
      id,
      time,
      value: cloneAuthoring(value),
      curve,
    };
    Object.assign(key, { time, value: cloneAuthoring(value), curve });
    if (!existing) channel.keys.push(key);
    channel.keys.sort((a, b) => a.time - b.time);
    return cloneAuthoring(key as AuthoredKey<T>);
  }
  removeKeys(keyIds: readonly string[]): void {
    const ids = new Set(keyIds);
    for (const channel of this.activeMutable().channels)
      channel.keys = channel.keys.filter((key) => !ids.has(key.id));
    this.selectKeys([]);
  }
  moveKeys(keyIds: readonly string[], delta: number, snap = 0): void {
    finiteAuthoring(delta, "delta");
    const ids = new Set(keyIds);
    const clip = this.activeMutable();
    for (const channel of clip.channels)
      for (const key of channel.keys)
        if (ids.has(key.id)) {
          const next =
            snap > 0
              ? Math.round((key.time + delta) / snap) * snap
              : key.time + delta;
          assertTime(next, clip.duration);
          key.time = next;
        }
    for (const channel of clip.channels)
      channel.keys.sort((a, b) => a.time - b.time);
  }
  duplicateKeys(keyIds: readonly string[], delta = 0): string[] {
    const ids = new Set(keyIds);
    const created: string[] = [];
    for (const channel of this.activeMutable().channels) {
      const copies = channel.keys
        .filter((key) => ids.has(key.id))
        .map((key) => {
          const copy = {
            ...cloneAuthoring(key),
            id: this.nextId("key"),
            time: key.time + delta,
          };
          assertTime(copy.time, this.activeMutable().duration);
          created.push(copy.id);
          return copy;
        });
      channel.keys.push(...copies);
      channel.keys.sort((a, b) => a.time - b.time);
    }
    return created;
  }
  setAutoKey(mode: AutoKeyMode): void {
    this.autoKey = mode;
  }

  syncRows(labels: ReadonlyMap<string, string> = new Map()): TimelineRow[] {
    const clip = this.active;
    this.view.rows = (clip?.channels ?? []).map((channel) => ({
      id: channel.id,
      label: labels.get(channel.id) ?? `${channel.kind}.${channel.property}`,
      channelId: channel.id,
    }));
    return cloneAuthoring(this.view.rows);
  }

  setMarkers(markers: readonly TimelineMarker[]): void {
    const clip = this.active;
    if (clip)
      markers.forEach((marker) => assertTime(marker.time, clip.duration));
    this.view.markers = cloneAuthoring([...markers]).sort(
      (a, b) => a.time - b.time,
    );
  }

  setLoop(start: number, end: number, enabled = true): void {
    const clip = this.active;
    if (!clip || start < 0 || end <= start || end > clip.duration)
      throw new Error("ANIMATION_AUTHORING_INVALID_LOOP");
    this.view.loop = { start, end, enabled };
  }

  setZoom(zoom: number): void {
    finiteAuthoring(zoom, "zoom");
    if (zoom <= 0) throw new Error("ANIMATION_AUTHORING_INVALID_ZOOM");
    this.view.zoom = zoom;
  }

  snapFrame(time: number): number {
    const clip = this.active;
    if (!clip) return time;
    return Math.max(
      0,
      Math.min(clip.duration, Math.round(time * clip.fps) / clip.fps),
    );
  }

  selectKeysInBox(
    start: number,
    end: number,
    channelIds?: readonly string[],
  ): string[] {
    const low = Math.min(start, end),
      high = Math.max(start, end);
    const allowed = channelIds ? new Set(channelIds) : undefined;
    const ids = (this.active?.channels ?? []).flatMap((channel) =>
      allowed?.has(channel.id) === false
        ? []
        : channel.keys
            .filter((key) => key.time >= low && key.time <= high)
            .map((key) => key.id),
    );
    this.selectKeys(ids);
    return ids;
  }

  setKeyCurve(keyIds: readonly string[], curve: CurveSpec): void {
    const ids = new Set(keyIds);
    for (const channel of this.activeMutable().channels)
      for (const key of channel.keys)
        if (ids.has(key.id)) key.curve = cloneAuthoring(curve);
  }

  setBezierHandles(
    keyIds: readonly string[],
    handles: { cx1: number; cy1: number; cx2: number; cy2: number },
  ): void {
    if (
      ![handles.cx1, handles.cy1, handles.cx2, handles.cy2].every(
        Number.isFinite,
      ) ||
      handles.cx1 < 0 ||
      handles.cx1 > 1 ||
      handles.cx2 < 0 ||
      handles.cx2 > 1
    )
      throw new Error("ANIMATION_AUTHORING_INVALID_BEZIER_HANDLES");
    this.setKeyCurve(keyIds, { type: "bezier", ...handles });
  }

  offsetNumericValues(keyIds: readonly string[], delta: number): void {
    finiteAuthoring(delta, "delta");
    const ids = new Set(keyIds);
    for (const channel of this.activeMutable().channels)
      for (const key of channel.keys)
        if (ids.has(key.id) && typeof key.value === "number")
          key.value += delta;
  }
  autoKey: AutoKeyMode = "off";
  selectKeys(ids: readonly string[]): void {
    this.view.selectedKeyIds = new Set(ids);
  }
  setPlayhead(time: number): void {
    const clip = this.active;
    if (clip) assertTime(time, clip.duration);
    this.view.playhead = time;
  }
  setRange(start: number, end: number): void {
    finiteAuthoring(start, "range");
    finiteAuthoring(end, "range");
    if (start < 0 || end <= start)
      throw new Error("ANIMATION_AUTHORING_INVALID_RANGE");
    this.view.visibleStart = start;
    this.view.visibleEnd = end;
    this.view.loop.end = end;
  }
  private nextId(prefix: string): string {
    return `${prefix}-${++this.#sequence}`;
  }
  private require(id: string): AnimationClip {
    const clip = this.#clips.find((item) => item.id === id);
    if (!clip) throw new Error("ANIMATION_AUTHORING_NOT_FOUND");
    return clip;
  }
  private activeMutable(): AnimationClip {
    if (!this.#activeId) throw new Error("ANIMATION_AUTHORING_NO_ACTIVE_CLIP");
    return this.require(this.#activeId);
  }
}

export class AuthoringPlayback {
  time = 0;
  playing = false;
  speed = 1;
  loop = true;
  loopStart = 0;
  loopEnd: number;
  constructor(
    public duration: number,
    public fps = 30,
  ) {
    finiteAuthoring(duration, "duration");
    finiteAuthoring(fps, "fps");
    this.loopEnd = duration;
  }
  setLoopRange(start: number, end: number): void {
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end <= start ||
      end > this.duration
    )
      throw new Error("ANIMATION_AUTHORING_INVALID_LOOP");
    this.loopStart = start;
    this.loopEnd = end;
    this.seek(Math.max(start, Math.min(end, this.time)));
  }
  seek(time: number): void {
    this.time = Math.max(0, Math.min(this.duration, time));
  }
  step(frames: number): number {
    this.seek(this.time + frames / this.fps);
    return this.time;
  }
  advance(seconds: number): number {
    finiteAuthoring(seconds, "delta");
    if (!this.playing) return this.time;
    const next = this.time + seconds * this.speed;
    this.time =
      this.loop && this.loopEnd > this.loopStart
        ? this.loopStart +
          ((((next - this.loopStart) % (this.loopEnd - this.loopStart)) +
            (this.loopEnd - this.loopStart)) %
            (this.loopEnd - this.loopStart))
        : Math.min(this.duration, Math.max(0, next));
    if (!this.loop && this.time === this.duration) this.playing = false;
    return this.time;
  }
}

export interface AuthoredEvent {
  id: string;
  time: number;
  name: string;
  payload?: unknown;
}
export function eventsCrossed(
  events: readonly AuthoredEvent[],
  previous: number,
  current: number,
): AuthoredEvent[] {
  return events
    .filter((event) => event.time > previous && event.time <= current)
    .map(cloneAuthoring);
}
