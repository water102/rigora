import { describe, expect, it } from "vitest";
import { PhysicsWorld } from "../../packages/runtime/src/physics.js";

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
});
