import { describe, expect, it } from "vitest";
import {
  compilePath,
  samplePathAtDistance,
  createSetupSnapshot,
  createPoseSnapshot,
  solvePathConstraint,
  type CompiledPath,
} from "../../packages/runtime/src/index.js";
import { pathSkeleton } from "../fixtures/canonical/path-skeleton.js";

describe("Path Geometry & Arc-Length Sampling — Batch 13", () => {
  it("computes exact arc length and uniform sampling on straight cubic segment", () => {
    // A straight cubic curve from (0, 0) to (100, 0)
    const points = [
      { x: 0, y: 0 },
      { x: 33.333, y: 0 },
      { x: 66.666, y: 0 },
      { x: 100, y: 0 },
    ];
    const path: CompiledPath = compilePath(points, false, true);

    expect(path.totalLength).toBeCloseTo(100, 2);

    // Sample at midpoint
    const mid = samplePathAtDistance(path, 50);
    expect(mid.x).toBeCloseTo(50, 2);
    expect(mid.y).toBeCloseTo(0, 2);
    expect(mid.tangentAngle).toBeCloseTo(0, 3);

    // Sample at 25%
    const q1 = samplePathAtDistance(path, 25);
    expect(q1.x).toBeCloseTo(25, 2);
    expect(q1.y).toBeCloseTo(0, 2);
  });

  it("accurately computes arc length and tangents on high-curvature curve", () => {
    // Symmetrical arch: (0, 0) -> (25, 50) -> (75, 50) -> (100, 0)
    const points = [
      { x: 0, y: 0 },
      { x: 25, y: 50 },
      { x: 75, y: 50 },
      { x: 100, y: 0 },
    ];
    const path = compilePath(points, false, true);

    expect(path.totalLength).toBeGreaterThan(100);

    // Start point
    const start = samplePathAtDistance(path, 0);
    expect(start.x).toBeCloseTo(0, 2);
    expect(start.y).toBeCloseTo(0, 2);
    // At start, tangent points up and right
    expect(start.tangentAngle).toBeGreaterThan(0);

    // Midpoint: by symmetry, should be at x = 50, peak y > 0, horizontal tangent
    const mid = samplePathAtDistance(path, path.totalLength / 2);
    expect(mid.x).toBeCloseTo(50, 1);
    expect(mid.y).toBeGreaterThan(30);
    expect(mid.tangentAngle).toBeCloseTo(0, 2);

    // End point: tangent points down and right
    const end = samplePathAtDistance(path, path.totalLength);
    expect(end.x).toBeCloseTo(100, 1);
    expect(end.y).toBeCloseTo(0, 1);
    expect(end.tangentAngle).toBeLessThan(0);
  });

  it("handles open path clamping and closed path modulo wrapping", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 50, y: 100 },
      { x: 100, y: 100 },
    ];

    // Open path: clamp
    const openPath = compilePath(points, false, true);
    const below = samplePathAtDistance(openPath, -20);
    expect(below.x).toBeCloseTo(0, 2);
    expect(below.y).toBeCloseTo(0, 2);

    const above = samplePathAtDistance(openPath, openPath.totalLength + 50);
    expect(above.x).toBeCloseTo(100, 2);
    expect(above.y).toBeCloseTo(100, 2);

    // Closed path: modulo wrap
    const closedPath = compilePath(
      [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 50, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 50 },
        { x: 50, y: 0 },
      ],
      true,
      true,
    );
    const wrapPos = samplePathAtDistance(
      closedPath,
      closedPath.totalLength + 10,
    );
    const directPos = samplePathAtDistance(closedPath, 10);
    expect(wrapPos.x).toBeCloseTo(directPos.x, 3);
    expect(wrapPos.y).toBeCloseTo(directPos.y, 3);
  });
});

describe("Path Constraint Runtime Solver — Batch 13", () => {
  it("positions and aligns bones along path in tangent mode", () => {
    const { skeleton } = pathSkeleton();
    const result = createSetupSnapshot(skeleton);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const b1 = result.snapshot.bones.find((b) => b.id === "bone-p1")!;
    const b2 = result.snapshot.bones.find((b) => b.id === "bone-p2")!;
    const b3 = result.snapshot.bones.find((b) => b.id === "bone-p3")!;

    expect(b1).toBeDefined();
    expect(b2).toBeDefined();
    expect(b3).toBeDefined();

    // Bone-p1 starts at position 0 (origin 0, 0)
    expect(b1.origin.x).toBeCloseTo(0, 1);
    expect(b1.origin.y).toBeCloseTo(0, 1);

    // Bone-p2 is spaced by bone-p1 length (30 units along the curve)
    expect(b2.origin.x).toBeGreaterThan(b1.origin.x);
    expect(b2.origin.y).toBeGreaterThan(b1.origin.y);

    // Bone-p3 is spaced by bone-p2 length (60 units along curve)
    expect(b3.origin.x).toBeGreaterThan(b2.origin.x);

    // All bones follow tangent orientations
    expect(b1.tip.x).toBeGreaterThan(b1.origin.x);
    expect(b1.tip.y).toBeGreaterThan(b1.origin.y);
  });

  it("respects chain mode where each bone aims at the next bone origin", () => {
    const { skeleton } = pathSkeleton();
    skeleton.constraints[0]!.rotateMode = "chain";

    const result = createSetupSnapshot(skeleton);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const b1 = result.snapshot.bones.find((b) => b.id === "bone-p1")!;
    const b2 = result.snapshot.bones.find((b) => b.id === "bone-p2")!;

    // In chain mode, bone-p1 should point directly toward bone-p2 origin
    const dx = b2.origin.x - b1.origin.x;
    const dy = b2.origin.y - b1.origin.y;
    const targetAngle = Math.atan2(dy, dx);

    const tipDx = b1.tip.x - b1.origin.x;
    const tipDy = b1.tip.y - b1.origin.y;
    const actualAngle = Math.atan2(tipDy, tipDx);

    expect(actualAngle).toBeCloseTo(targetAngle, 3);
  });

  it("supports chainScale mode adjusting bone length to span between origins", () => {
    const { skeleton } = pathSkeleton();
    skeleton.constraints[0]!.rotateMode = "chainScale";

    const result = createSetupSnapshot(skeleton);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const b1 = result.snapshot.bones.find((b) => b.id === "bone-p1")!;
    const b2 = result.snapshot.bones.find((b) => b.id === "bone-p2")!;

    // In chainScale mode, bone-p1 tip should contact bone-p2 origin exactly!
    expect(b1.tip.x).toBeCloseTo(b2.origin.x, 2);
    expect(b1.tip.y).toBeCloseTo(b2.origin.y, 2);
  });

  it("supports percent position and spacing modes", () => {
    const { skeleton } = pathSkeleton();
    const constraint = skeleton.constraints[0]!;
    constraint.positionMode = "percent";
    constraint.spacingMode = "percent";
    constraint.position = 0.5; // Start at 50% along the curve
    constraint.spacing = 0.2; // 20% between bones

    const result = createSetupSnapshot(skeleton);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const b1 = result.snapshot.bones.find((b) => b.id === "bone-p1")!;
    // At 50% of symmetrical arch (0,0) -> (100, 0), x is around 50
    expect(b1.origin.x).toBeCloseTo(50, 1);
    expect(b1.origin.y).toBeGreaterThan(30);
  });

  it("interpolates translation and rotation smoothly via mix parameters", () => {
    const { skeleton } = pathSkeleton();
    const constraint = skeleton.constraints[0]!;
    // Mix 0: bones stay at setup pose (0, 0) pointing along +X
    constraint.mixX = 0;
    constraint.mixY = 0;
    constraint.mixRotate = 0;

    const result0 = createSetupSnapshot(skeleton);
    expect(result0.success).toBe(true);
    if (!result0.success) return;

    const b1_0 = result0.snapshot.bones.find((b) => b.id === "bone-p1")!;
    expect(b1_0.origin.x).toBeCloseTo(0, 4);
    expect(b1_0.origin.y).toBeCloseTo(0, 4);
    expect(b1_0.tip.x).toBeCloseTo(30, 4);
    expect(b1_0.tip.y).toBeCloseTo(0, 4);

    // Mix 0.5: halfway between setup (0, 0) and path point
    constraint.mixX = 0.5;
    constraint.mixY = 0.5;
    constraint.position = 0.5;
    const resultHalf = createSetupSnapshot(skeleton);
    expect(resultHalf.success).toBe(true);
    if (!resultHalf.success) return;

    const b1_half = resultHalf.snapshot.bones.find((b) => b.id === "bone-p1")!;
    // Midpoint of path is around (50, 37.5). Halfway from (0, 0) is around (25, 18.75)
    expect(b1_half.origin.x).toBeGreaterThan(15);
    expect(b1_half.origin.x).toBeLessThan(35);
  });

  it("updates dynamically when path vertices are deformed/weighted by driver bones", () => {
    const { skeleton } = pathSkeleton();
    // Switch constraint to target the weighted path
    const constraint = skeleton.constraints[0]!;
    constraint.targetSlotId = "slot-weighted-path";

    // First evaluate at setup
    const initialResult = createSetupSnapshot(skeleton);
    expect(initialResult.success).toBe(true);
    if (!initialResult.success) return;

    const b1Initial = initialResult.snapshot.bones.find(
      (b) => b.id === "bone-p1",
    )!;

    // Now move bone-driver-1 to (50, 100)
    skeleton.bones.find((b) => b.id === "bone-driver-1")!.setup.x = 50;
    skeleton.bones.find((b) => b.id === "bone-driver-1")!.setup.y = 100;

    const movedResult = createSetupSnapshot(skeleton);
    expect(movedResult.success).toBe(true);
    if (!movedResult.success) return;

    const b1Moved = movedResult.snapshot.bones.find((b) => b.id === "bone-p1")!;

    // Because Point 0 of the weighted path is bound 100% to bone-driver-1,
    // when bone-driver-1 moves to (50, 100), the start of the path moves to (50, 100)
    // and bone-p1 must follow!
    expect(b1Moved.origin.x).toBeCloseTo(50, 1);
    expect(b1Moved.origin.y).toBeCloseTo(100, 1);
    expect(b1Moved.origin.x).not.toEqual(b1Initial.origin.x);
  });

  it("supports closed loop path wrapping around smoothly", () => {
    const { skeleton } = pathSkeleton();
    const constraint = skeleton.constraints[0]!;
    constraint.targetSlotId = "slot-closed-path";
    constraint.position = 0.95; // Near end of loop
    constraint.spacing = 0.1; // Next bones wrap around to start of loop

    const result = createSetupSnapshot(skeleton);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const b1 = result.snapshot.bones.find((b) => b.id === "bone-p1")!;
    const b2 = result.snapshot.bones.find((b) => b.id === "bone-p2")!;

    expect(b1).toBeDefined();
    expect(b2).toBeDefined();
    // Bones evaluated smoothly without infinite loop or NaN
    expect(Number.isFinite(b1.origin.x)).toBe(true);
    expect(Number.isFinite(b2.origin.x)).toBe(true);
  });

  it("evaluates constraint chaining: IK constraint precedes Path constraint", () => {
    const { skeleton } = pathSkeleton();
    // Add an IK target bone and 1-bone IK constraint that aims bone-driver-1 at target
    skeleton.bones.push({
      id: "ik-target",
      name: "ik-target",
      parentId: "root",
      length: 0,
      setup: {
        x: 0,
        y: 50,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        shearX: 0,
        shearY: 0,
      },
      inherit: "normal",
    });

    skeleton.constraints.unshift({
      id: "ik-aim-driver",
      name: "ik-aim-driver",
      type: "ik",
      order: 0, // runs before path constraint (order 1)
      targetBoneId: "ik-target",
      boneIds: ["bone-driver-1"],
      mix: 1,
      bendDirection: 1,
    });

    // Make path constraint target the weighted path and run after IK
    const pc = skeleton.constraints.find((c) => c.id === "pc-open")!;
    pc.targetSlotId = "slot-weighted-path";
    pc.order = 1;

    const result = createSetupSnapshot(skeleton);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // Driver bone should be rotated 90 degrees pointing along +Y
    const driver = result.snapshot.bones.find((b) => b.id === "bone-driver-1")!;
    expect(driver.tip.x).toBeCloseTo(0, 2);
    expect(driver.tip.y).toBeCloseTo(20, 2);

    // And bone-p1 on the path was successfully evaluated
    const p1 = result.snapshot.bones.find((b) => b.id === "bone-p1")!;
    expect(Number.isFinite(p1.origin.x)).toBe(true);
  });

  it("updates descendant bones parented to a path-constrained bone", () => {
    const { skeleton } = pathSkeleton();
    // Add child bone to bone-p1
    skeleton.bones.push({
      id: "child-of-p1",
      name: "child-of-p1",
      parentId: "bone-p1",
      length: 15,
      setup: {
        x: 10,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        shearX: 0,
        shearY: 0,
      },
      inherit: "normal",
    });

    const result = createSetupSnapshot(skeleton);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const p1 = result.snapshot.bones.find((b) => b.id === "bone-p1")!;
    const child = result.snapshot.bones.find((b) => b.id === "child-of-p1")!;

    // Child origin should be offset from p1 origin in p1's rotated coordinate frame
    expect(child).toBeDefined();
    expect(child.origin.x).not.toEqual(10); // Not world (10, 0), transformed by p1
    expect(Number.isFinite(child.origin.x)).toBe(true);
    expect(Number.isFinite(child.origin.y)).toBe(true);
  });
});
