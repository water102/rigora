import { describe, expect, it } from "vitest";
import {
  identityTransform,
  identityMatrix,
  localToMatrix,
  multiply,
  inverse,
  isReflected,
  localToWorld,
  worldToLocal,
  composeWorld,
  reparentPreserveWorld,
  compileTransformHierarchy,
  evaluateTransformHierarchy,
  decomposeForAuthoring,
  type Mat2D,
  type Transform2D,
  type TransformInheritance,
  type TransformBone,
} from "../../packages/math/src/index.js";

const local = (overrides: Partial<Transform2D> = {}): Transform2D => ({
  ...identityTransform(),
  ...overrides,
});
function matrixClose(actual: Mat2D, expected: number[]): void {
  [actual.a, actual.b, actual.c, actual.d, actual.tx, actual.ty].forEach(
    (value, i) => expect(value).toBeCloseTo(expected[i]!, 9),
  );
}
const entries = (matrix: Mat2D) => [
  matrix.a,
  matrix.b,
  matrix.c,
  matrix.d,
  matrix.tx,
  matrix.ty,
];

describe("canonical transform goldens", () => {
  it("xf_001_root", () =>
    matrixClose(composeWorld(null, local({ x: 3, y: 4 })), [1, 0, 0, 1, 3, 4]));
  it("xf_002_parent_rotate", () =>
    matrixClose(
      composeWorld(
        localToMatrix(local({ rotation: Math.PI / 2 })),
        local({ x: 10 }),
      ),
      [0, 1, -1, 0, 0, 10],
    ));
  it("xf_003_parent_scale", () =>
    matrixClose(
      composeWorld(
        localToMatrix(local({ scaleX: 2, scaleY: 3 })),
        local({ x: 4, y: 5 }),
      ),
      [2, 0, 0, 3, 8, 15],
    ));
  it.each([
    ["xf_004_parent_negative_scale_x", -1, 1, [-1, 0, 0, 1, -4, 5]],
    ["xf_005_parent_negative_scale_y", 1, -1, [1, 0, 0, -1, 4, -5]],
    ["xf_006_parent_double_reflection", -1, -1, [-1, 0, 0, -1, -4, -5]],
  ] as const)("%s", (_name, scaleX, scaleY, expected) =>
    matrixClose(
      composeWorld(
        localToMatrix(local({ scaleX, scaleY })),
        local({ x: 4, y: 5 }),
      ),
      [...expected],
    ),
  );
  it("xf_007_shear: both authored axes contribute", () =>
    matrixClose(
      localToMatrix(
        local({
          shearX: Math.PI / 2,
          shearY: -Math.PI / 2,
          scaleX: 2,
          scaleY: 3,
        }),
      ),
      [0, 2, 3, 0, 0, 0],
    ));
  it("xf_008_only_translation", () =>
    matrixClose(
      composeWorld(
        localToMatrix(local({ x: 2, y: 3, rotation: Math.PI / 2, scaleX: 5 })),
        local({ x: 10 }),
        "onlyTranslation",
      ),
      [1, 0, 0, 1, 12, 3],
    ));
  it("xf_009_no_scale: orthogonalizes a sheared reflected parent", () => {
    const parent = { a: 0, b: 2, c: 3, d: 4, tx: 5, ty: 6 };
    matrixClose(
      composeWorld(parent, local({ x: 10, y: 2 }), "noScale"),
      [0, 1, 1, 0, 7, 16],
    );
    matrixClose(
      composeWorld(parent, local({ x: 10, y: 2 }), "noScaleOrReflection"),
      [0, 1, -1, 0, 3, 16],
    );
  });
  it("xf_010_no_rotation_reflection", () =>
    matrixClose(
      composeWorld(
        { a: 0, b: 2, c: 3, d: 4, tx: 5, ty: 6 },
        local({ x: 10, y: 2 }),
        "noRotationOrReflection",
      ),
      [2, 0, 0, 3, 25, 12],
    ));
  it.each<TransformInheritance>([
    "normal",
    "onlyTranslation",
    "noRotationOrReflection",
    "noScale",
    "noScaleOrReflection",
  ])("xf_011_reparent_preserve_world (%s)", (mode) => {
    const old = localToMatrix(
      local({
        x: 13,
        y: -8,
        rotation: 0.4,
        shearX: 0.2,
        shearY: -0.3,
        scaleX: -2,
        scaleY: 3,
      }),
    );
    const parent = localToMatrix(
      local({ x: 7, y: 9, rotation: -0.8, scaleX: 4, scaleY: -2 }),
    );
    const authored = reparentPreserveWorld(old, parent, 0.4, mode);
    expect(authored.rotation).toBe(0.4);
    matrixClose(composeWorld(parent, authored, mode), entries(old));
    matrixClose(localToMatrix(reparentPreserveWorld(old, null)), entries(old));
  });
  it("xf_012_singular_parent: blocks inverse-dependent edits", () => {
    const parent = localToMatrix(local({ scaleX: 0 }));
    expect(inverse(parent)).toBeNull();
    expect(() => worldToLocal(parent, { x: 1, y: 2 })).toThrow("invertible");
    expect(() => reparentPreserveWorld(identityMatrix(), parent)).toThrow(
      "invertible",
    );
    expect(() =>
      composeWorld(
        { a: 0, b: 0, c: 0, d: 0, tx: 0, ty: 0 },
        local(),
        "noScale",
      ),
    ).toThrow("rotation basis");
  });
  it("xf_013_deep_chain: compiles parent-first without mutating authored order", () => {
    const bones: TransformBone[] = Array.from({ length: 10000 }, (_, i) => ({
      id: String(i),
      ...(i > 0 ? { parentId: String(i - 1) } : {}),
      setup: local({ x: 1 }),
      inherit: "normal",
    }));
    bones.reverse();
    const compiled = compileTransformHierarchy(bones);
    const result = evaluateTransformHierarchy(compiled);
    matrixClose(result.at(-1)!, [1, 0, 0, 1, 10000, 0]);
    expect(bones[0]!.id).toBe("9999");
    expect(compiled.parentIndices.every((parent, i) => parent < i)).toBe(true);
  });
  it("xf_014_mixed_inheritance", () => {
    const compiled = compileTransformHierarchy([
      {
        id: "child",
        parentId: "root",
        setup: local({ x: 10 }),
        inherit: "onlyTranslation",
      },
      {
        id: "tip",
        parentId: "child",
        setup: local({ y: 4 }),
        inherit: "noScale",
      },
      {
        id: "root",
        setup: local({ rotation: Math.PI / 2, scaleX: -2, x: 1 }),
        inherit: "normal",
      },
    ]);
    matrixClose(evaluateTransformHierarchy(compiled)[2]!, [1, 0, 0, 1, 11, 4]);
  });
});

describe("affine algebra and numeric guards", () => {
  it("inverse and point round-trip over a deterministic reflected/sheared corpus", () => {
    for (let i = 1; i <= 100; i++) {
      const matrix = localToMatrix(
        local({
          x: i / 3,
          y: -i / 7,
          rotation: i * 0.13,
          scaleX: i % 2 ? -2 : 2,
          scaleY: 0.3 + i / 20,
          shearX: 0.1,
          shearY: -0.2,
        }),
      );
      matrixClose(multiply(matrix, inverse(matrix)!), [1, 0, 0, 1, 0, 0]);
      const point = worldToLocal(matrix, localToWorld(matrix, { x: 3, y: -9 }));
      expect(point.x).toBeCloseTo(3, 9);
      expect(point.y).toBeCloseTo(-9, 9);
      matrixClose(
        localToMatrix(decomposeForAuthoring(matrix, 0.7)),
        entries(matrix),
      );
      expect(isReflected(matrix)).toBe(i % 2 === 1);
    }
  });
  it.each([1e-150, 1e150])(
    "inverts uniformly scaled frames at scale %s",
    (scale) => {
      const matrix = localToMatrix(local({ scaleX: scale, scaleY: scale }));
      matrixClose(multiply(matrix, inverse(matrix)!), [1, 0, 0, 1, 0, 0]);
    },
  );
  it("rejects near-singular axes and nonfinite inputs", () => {
    expect(inverse({ a: 1, b: 0, c: 0, d: 1e-14, tx: 0, ty: 0 })).toBeNull();
    expect(() => localToMatrix(local({ x: NaN }))).toThrow("finite");
    expect(() => composeWorld(null, local(), "customPreserved")).toThrow(
      "cannot be evaluated",
    );
  });
  it("uses Y when X collapses and round-trips degenerate authoring axes", () => {
    matrixClose(
      composeWorld(
        { a: 0, b: 0, c: -3, d: 0, tx: 0, ty: 0 },
        local(),
        "noScale",
      ),
      [0, 1, -1, 0, 0, 0],
    );
    const matrix = { a: 0, b: 0, c: -3, d: 0, tx: 2, ty: 1 };
    matrixClose(localToMatrix(decomposeForAuthoring(matrix)), entries(matrix));
  });
  it("rejects duplicate, missing and cyclic hierarchy references", () => {
    const root: TransformBone = {
      id: "root",
      setup: local(),
      inherit: "normal",
    };
    expect(() => compileTransformHierarchy([root, root])).toThrow("Duplicate");
    expect(() =>
      compileTransformHierarchy([{ ...root, parentId: "absent" }]),
    ).toThrow("Missing");
    expect(() =>
      compileTransformHierarchy([{ ...root, parentId: "root" }]),
    ).toThrow("cycle");
  });
});
