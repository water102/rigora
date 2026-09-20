import type { ConstraintData, TimelineData } from "@rigora/model";

export interface PhysicsBodyState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}
export interface PhysicsTarget {
  x: number;
  y: number;
}

export interface PhysicsStepOptions {
  fixedDt?: number;
  maxSubsteps?: number;
}

export type PhysicsConstraint = Extract<ConstraintData, { type: "physics" }>;

export function samplePhysicsParameters(
  constraints: readonly PhysicsConstraint[],
  timelines: readonly TimelineData[],
  time: number,
): PhysicsConstraint[] {
  if (!Number.isFinite(time) || time < 0)
    throw new RangeError("time must be finite and nonnegative");
  return constraints.map((constraint) => {
    let result: PhysicsConstraint = { ...constraint };
    for (const timeline of timelines) {
      if (
        timeline.targetId !== constraint.id ||
        !timeline.type.startsWith("physics.")
      )
        continue;
      const parameter = timeline.type.slice(
        "physics.".length,
      ) as keyof PhysicsConstraint;
      if (
        !(parameter in constraint) ||
        parameter === "id" ||
        parameter === "name" ||
        parameter === "type" ||
        parameter === "order" ||
        parameter === "boneId"
      )
        continue;
      const numeric = timeline.keyframes.filter(
        (key) => typeof key.value === "number",
      ) as Array<{
        time: number;
        value: number;
        curve: { type: string };
      }>;
      if (!numeric.length) continue;
      let value = numeric[0]!.value;
      for (let index = 0; index < numeric.length; index++) {
        const current = numeric[index]!;
        if (current.time > time) break;
        value = current.value;
        const next = numeric[index + 1];
        if (next && time < next.time && current.curve.type !== "stepped") {
          const alpha = (time - current.time) / (next.time - current.time);
          value = current.value + (next.value - current.value) * alpha;
          break;
        }
      }
      (result as Record<string, unknown>)[parameter] = value;
    }
    return result;
  });
}

export interface BakedPhysicsKey {
  time: number;
  x: number;
  y: number;
}

export interface PhysicsBakeOptions {
  duration: number;
  sampleRate?: number;
  prewarm?: number;
  tolerance?: number;
  wind?: number;
}

export interface PhysicsBakeResult {
  keys: BakedPhysicsKey[];
  sampleRate: number;
  prewarm: number;
}
export interface PhysicsDebugSnapshot {
  enabled: boolean;
  accurateSeek: boolean;
  bodies: Readonly<Record<string, PhysicsBodyState>>;
}

/** Deterministic, fixed-step clean-room secondary-motion solver. */
export class PhysicsWorld {
  readonly fixedDt: number;
  readonly maxSubsteps: number;
  private accumulator = 0;
  private readonly initial = new Map<string, PhysicsBodyState>();
  private readonly bodies = new Map<string, PhysicsBodyState>();
  private readonly previousTargets = new Map<string, PhysicsTarget>();

  constructor(options: PhysicsStepOptions = {}) {
    this.fixedDt = options.fixedDt ?? 1 / 60;
    this.maxSubsteps = options.maxSubsteps ?? 8;
    if (!(this.fixedDt > 0) || !Number.isFinite(this.fixedDt))
      throw new RangeError("fixedDt must be finite and positive");
  }

  register(id: string, state: PhysicsBodyState): void {
    const copy = { ...state };
    this.bodies.set(id, copy);
    this.initial.set(id, { ...copy });
  }

  get(id: string): PhysicsBodyState | undefined {
    const state = this.bodies.get(id);
    return state && { ...state };
  }

  step(
    elapsed: number,
    constraints: readonly PhysicsConstraint[],
    wind = 0,
  ): number {
    if (!Number.isFinite(elapsed) || elapsed < 0)
      throw new RangeError("elapsed must be finite and nonnegative");
    this.accumulator += elapsed;
    let count = 0;
    while (this.accumulator >= this.fixedDt && count < this.maxSubsteps) {
      for (const constraint of constraints)
        this.integrate(constraint, this.fixedDt, wind);
      this.accumulator -= this.fixedDt;
      count++;
    }
    return count;
  }

  /** Steps with the non-physics target pose, applying inertia from target motion. */
  stepWithTargets(
    elapsed: number,
    constraints: readonly PhysicsConstraint[],
    targets: ReadonlyMap<string, PhysicsTarget>,
    wind = 0,
  ): number {
    if (!Number.isFinite(elapsed) || elapsed < 0)
      throw new RangeError("elapsed must be finite and nonnegative");
    this.accumulator += elapsed;
    let count = 0;
    while (this.accumulator >= this.fixedDt && count < this.maxSubsteps) {
      for (const constraint of constraints) {
        const target = targets.get(constraint.boneId);
        const previous = this.previousTargets.get(constraint.boneId);
        this.integrate(constraint, this.fixedDt, wind, target, previous);
        if (target) this.previousTargets.set(constraint.boneId, { ...target });
      }
      this.accumulator -= this.fixedDt;
      count++;
    }
    return count;
  }

  reset(): void {
    for (const [id, initial] of this.initial)
      this.bodies.set(id, { ...initial });
    this.accumulator = 0;
    this.previousTargets.clear();
  }

  seek(
    seconds: number,
    constraints: readonly PhysicsConstraint[],
    wind = 0,
  ): void {
    if (!Number.isFinite(seconds) || seconds < 0)
      throw new RangeError("seconds must be finite and nonnegative");
    this.reset();
    const steps = Math.floor(seconds / this.fixedDt + 1e-9);
    for (let i = 0; i < steps; i++)
      for (const c of constraints) this.integrate(c, this.fixedDt, wind);
  }

  private integrate(
    constraint: PhysicsConstraint,
    dt: number,
    wind: number,
    target?: PhysicsTarget,
    previousTarget?: PhysicsTarget,
  ): void {
    if (constraint.enabled === false) return;
    const state = this.bodies.get(constraint.boneId);
    if (!state) return;
    const strength = constraint.strength ?? 1;
    const damping = Math.max(0, constraint.damping ?? 0);
    const massInverse = Math.max(0, constraint.massInverse ?? 1);
    const gravity = constraint.gravity ?? 0;
    const forceX = (constraint.wind ?? wind) * strength;
    const forceY = gravity * strength;
    const inertia = Math.max(0, constraint.inertia ?? 0);
    if (target && previousTarget) {
      state.velocityX -= ((target.x - previousTarget.x) / dt) * inertia;
      state.velocityY -= ((target.y - previousTarget.y) / dt) * inertia;
    }
    state.velocityX += forceX * massInverse * dt;
    state.velocityY += forceY * massInverse * dt;
    const decay = Math.max(0, 1 - damping * dt);
    state.velocityX *= decay;
    state.velocityY *= decay;
    const mix = Math.min(1, Math.max(0, constraint.mix ?? 1));
    state.x += state.velocityX * dt * mix;
    state.y += state.velocityY * dt * mix;
  }
}

/** Editor/runtime façade for toggling, seeking and inspecting one physics world. */
export class PhysicsController {
  enabled = true;
  accurateSeek = true;

  constructor(
    readonly world: PhysicsWorld,
    readonly constraints: readonly PhysicsConstraint[],
  ) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.world.reset();
  }

  reset(): void {
    this.world.reset();
  }

  step(elapsed: number, wind = 0): number {
    return this.enabled ? this.world.step(elapsed, this.constraints, wind) : 0;
  }

  seek(seconds: number, wind = 0): void {
    if (!this.enabled) return;
    if (this.accurateSeek) this.world.seek(seconds, this.constraints, wind);
    else this.world.reset();
  }

  debugSnapshot(): PhysicsDebugSnapshot {
    const bodies: Record<string, PhysicsBodyState> = {};
    for (const constraint of this.constraints) {
      const state = this.world.get(constraint.boneId);
      if (state) bodies[constraint.boneId] = state;
    }
    return { enabled: this.enabled, accurateSeek: this.accurateSeek, bodies };
  }
}

function perpendicularDistance(
  key: BakedPhysicsKey,
  left: BakedPhysicsKey,
  right: BakedPhysicsKey,
): number {
  const span = right.time - left.time;
  if (span <= 0) return Math.hypot(key.x - left.x, key.y - left.y);
  const alpha = (key.time - left.time) / span;
  return Math.hypot(
    key.x - (left.x + (right.x - left.x) * alpha),
    key.y - (left.y + (right.y - left.y) * alpha),
  );
}

function reduceKeys(
  keys: BakedPhysicsKey[],
  tolerance: number,
): BakedPhysicsKey[] {
  if (keys.length <= 2 || tolerance < 0) return keys;
  const keep = new Set([0, keys.length - 1]);
  const visit = (start: number, end: number): void => {
    let max = tolerance;
    let index = -1;
    for (let i = start + 1; i < end; i++) {
      const error = perpendicularDistance(keys[i]!, keys[start]!, keys[end]!);
      if (error > max) {
        max = error;
        index = i;
      }
    }
    if (index >= 0) {
      keep.add(index);
      visit(start, index);
      visit(index, end);
    }
  };
  visit(0, keys.length - 1);
  return keys.filter((_, index) => keep.has(index));
}

/** Runs a deterministic physics simulation and returns reduced transform keys. */
export function bakePhysics(
  createWorld: () => PhysicsWorld,
  constraints: readonly PhysicsConstraint[],
  boneId: string,
  options: PhysicsBakeOptions,
): PhysicsBakeResult {
  const sampleRate = options.sampleRate ?? 60;
  const prewarm = options.prewarm ?? 0;
  if (!(sampleRate > 0) || !Number.isFinite(sampleRate))
    throw new RangeError("sampleRate must be finite and positive");
  if (!(options.duration >= 0) || !Number.isFinite(options.duration))
    throw new RangeError("duration must be finite and nonnegative");
  if (!(prewarm >= 0) || !Number.isFinite(prewarm))
    throw new RangeError("prewarm must be finite and nonnegative");
  const world = createWorld();
  const step = 1 / sampleRate;
  world.seek(prewarm, constraints, options.wind ?? 0);
  const keys: BakedPhysicsKey[] = [];
  const count = Math.round(options.duration * sampleRate);
  for (let frame = 0; frame <= count; frame++) {
    if (frame > 0) world.step(step, constraints, options.wind ?? 0);
    const state = world.get(boneId);
    if (state) keys.push({ time: frame * step, x: state.x, y: state.y });
  }
  return {
    keys: reduceKeys(keys, options.tolerance ?? 0),
    sampleRate,
    prewarm,
  };
}
