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
