import { describe, expect, it } from "vitest";
import {
  bakePhysics,
  PhysicsWorld,
} from "../../packages/runtime/src/physics.js";

const constraint = {
  id: "p",
  name: "p",
  type: "physics" as const,
  order: 0,
  boneId: "b",
  gravity: 10,
  damping: 0,
};

describe("PhysicsWorld", () => {
  it("advances only on deterministic fixed steps and resets", () => {
    const world = new PhysicsWorld({ fixedDt: 0.1 });
    world.register("b", { x: 0, y: 0, velocityX: 0, velocityY: 0 });
    expect(world.step(0.05, [constraint])).toBe(0);
    expect(world.step(0.05, [constraint])).toBe(1);
    const after = world.get("b")!;
    expect(after.velocityY).toBeCloseTo(1);
    expect(after.y).toBeCloseTo(0.1);
    world.reset();
    expect(world.get("b")).toEqual({ x: 0, y: 0, velocityX: 0, velocityY: 0 });
  });

  it("seek matches repeated fixed steps", () => {
    const a = new PhysicsWorld({ fixedDt: 1 / 60 });
    const b = new PhysicsWorld({ fixedDt: 1 / 60 });
    a.register("b", { x: 0, y: 0, velocityX: 0, velocityY: 0 });
    b.register("b", { x: 0, y: 0, velocityX: 0, velocityY: 0 });
    a.seek(0.9, [constraint]);
    for (let i = 0; i < 54; i++) b.step(1 / 60, [constraint]);
    expect(a.get("b")).toEqual(b.get("b"));
  });

  it("bakes deterministic samples with prewarm and preserves endpoints", () => {
    const create = () => {
      const world = new PhysicsWorld({ fixedDt: 0.1, maxSubsteps: 100 });
      world.register("b", { x: 0, y: 0, velocityX: 0, velocityY: 0 });
      return world;
    };
    const options = {
      duration: 0.5,
      sampleRate: 10,
      prewarm: 0.2,
      tolerance: 0,
    };
    const first = bakePhysics(create, [constraint], "b", options);
    const second = bakePhysics(create, [constraint], "b", options);
    expect(first).toEqual(second);
    expect(first.keys[0]!.time).toBe(0);
    expect(first.keys.at(-1)!.time).toBe(0.5);
  });

  it("reduces linear samples within tolerance", () => {
    const create = () => {
      const world = new PhysicsWorld({ fixedDt: 0.1 });
      world.register("b", { x: 0, y: 0, velocityX: 1, velocityY: 0 });
      return world;
    };
    const result = bakePhysics(create, [], "b", {
      duration: 0.5,
      sampleRate: 10,
      tolerance: 0.001,
    });
    expect(result.keys).toHaveLength(2);
  });

  it("applies inertia from target motion only after an initial target sample", () => {
    const world = new PhysicsWorld({ fixedDt: 0.1 });
    world.register("b", { x: 0, y: 0, velocityX: 0, velocityY: 0 });
    const targets = new Map([["b", { x: 0, y: 0 }]]);
    const inertial = { ...constraint, inertia: 1 };
    world.stepWithTargets(0.1, [inertial], targets);
    targets.set("b", { x: 1, y: 0 });
    world.stepWithTargets(0.1, [inertial], targets);
    expect(world.get("b")!.velocityX).toBeCloseTo(-10);
  });
});
