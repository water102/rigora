import type { ConstraintData } from "@rigora/model";

export interface PhysicsBodyState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export interface PhysicsStepOptions {
  fixedDt?: number;
  maxSubsteps?: number;
}

export type PhysicsConstraint = Extract<ConstraintData, { type: "physics" }>;

/** Deterministic, fixed-step clean-room secondary-motion solver. */
export class PhysicsWorld {
  readonly fixedDt: number;
  readonly maxSubsteps: number;
  private accumulator = 0;
  private readonly initial = new Map<string, PhysicsBodyState>();
  private readonly bodies = new Map<string, PhysicsBodyState>();

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

  reset(): void {
    for (const [id, initial] of this.initial)
      this.bodies.set(id, { ...initial });
    this.accumulator = 0;
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
