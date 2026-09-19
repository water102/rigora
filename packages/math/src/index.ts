/** Canonical math: X right, Y up, counter-clockwise radians. */
export interface Vec2 {
  x: number;
  y: number;
}
/** Affine rows: [a, c, tx], [b, d, ty], [0, 0, 1]. */
export interface Mat2D {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}
export interface Transform2D {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  shearX: number;
  shearY: number;
}
export interface Rgb {
  r: number;
  g: number;
  b: number;
}
export interface Rgba extends Rgb {
  a: number;
}

export function identityMatrix(): Mat2D {
  return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
}

export function identityTransform(): Transform2D {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    shearX: 0,
    shearY: 0,
  };
}

export type TransformInheritance =
  | "normal"
  | "onlyTranslation"
  | "noRotationOrReflection"
  | "noScale"
  | "noScaleOrReflection"
  | "customPreserved";

/** Relative determinant threshold after scaling the largest linear entry to 1. */
export const TRANSFORM_EPSILON = 1e-12;

export class TransformError extends Error {
  constructor(
    public readonly code:
      | "CORE_SINGULAR_TRANSFORM"
      | "CORE_NON_FINITE_NUMBER"
      | "CORE_UNSUPPORTED_INHERITANCE"
      | "CORE_INVALID_HIERARCHY",
    message: string,
  ) {
    super(message);
    this.name = "TransformError";
  }
}

function finiteValues(...values: number[]): void {
  if (!values.every(Number.isFinite))
    throw new TransformError(
      "CORE_NON_FINITE_NUMBER",
      "Transform operations require finite values and results.",
    );
}

function checked(matrix: Mat2D): Mat2D {
  finiteValues(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
  return matrix;
}

export function determinant(matrix: Readonly<Mat2D>): number {
  const result = matrix.a * matrix.d - matrix.b * matrix.c;
  finiteValues(result);
  return result;
}

export function isReflected(matrix: Readonly<Mat2D>): boolean {
  checked(matrix);
  const scale = Math.max(
    Math.abs(matrix.a),
    Math.abs(matrix.b),
    Math.abs(matrix.c),
    Math.abs(matrix.d),
  );
  return (
    scale > 0 &&
    (matrix.a / scale) * (matrix.d / scale) -
      (matrix.b / scale) * (matrix.c / scale) <
      0
  );
}

/** Composition applies right first, then left. Inputs are never mutated. */
export function multiply(left: Readonly<Mat2D>, right: Readonly<Mat2D>): Mat2D {
  checked(left);
  checked(right);
  return checked({
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    tx: left.a * right.tx + left.c * right.ty + left.tx,
    ty: left.b * right.tx + left.d * right.ty + left.ty,
  });
}

/** Returns null for ill-conditioned or unrepresentable inverses. */
export function inverse(matrix: Readonly<Mat2D>): Mat2D | null {
  checked(matrix);
  const scale = Math.max(
    Math.abs(matrix.a),
    Math.abs(matrix.b),
    Math.abs(matrix.c),
    Math.abs(matrix.d),
  );
  if (scale === 0) return null;
  const a = matrix.a / scale,
    b = matrix.b / scale,
    c = matrix.c / scale,
    d = matrix.d / scale;
  const det = a * d - b * c;
  if (Math.abs(det) <= TRANSFORM_EPSILON) return null;
  const result = {
    a: d / det / scale,
    b: -b / det / scale,
    c: -c / det / scale,
    d: a / det / scale,
    tx: 0,
    ty: 0,
  };
  result.tx = -(result.a * matrix.tx + result.c * matrix.ty);
  result.ty = -(result.b * matrix.tx + result.d * matrix.ty);
  return Object.values(result).every(Number.isFinite) ? result : null;
}

export function transformPoint(
  matrix: Readonly<Mat2D>,
  point: Readonly<Vec2>,
): Vec2 {
  checked(matrix);
  finiteValues(point.x, point.y);
  const result = {
    x: matrix.a * point.x + matrix.c * point.y + matrix.tx,
    y: matrix.b * point.x + matrix.d * point.y + matrix.ty,
  };
  finiteValues(result.x, result.y);
  return result;
}

export const localToWorld = transformPoint;

export function worldToLocal(
  parent: Readonly<Mat2D>,
  point: Readonly<Vec2>,
): Vec2 {
  const inv = inverse(parent);
  if (!inv)
    throw new TransformError(
      "CORE_SINGULAR_TRANSFORM",
      "World-to-local conversion requires an invertible parent.",
    );
  return transformPoint(inv, point);
}

export function localToMatrix(local: Readonly<Transform2D>): Mat2D {
  finiteValues(
    local.x,
    local.y,
    local.rotation,
    local.scaleX,
    local.scaleY,
    local.shearX,
    local.shearY,
  );
  const xAngle = local.rotation + local.shearX;
  const yAngle = local.rotation + local.shearY;
  return checked({
    a: Math.cos(xAngle) * local.scaleX,
    b: Math.sin(xAngle) * local.scaleX,
    c: -Math.sin(yAngle) * local.scaleY,
    d: Math.cos(yAngle) * local.scaleY,
    tx: local.x,
    ty: local.y,
  });
}

type SupportedInheritance = Exclude<TransformInheritance, "customPreserved">;

function rotationBasis(
  parent: Readonly<Mat2D>,
  preserveReflection: boolean,
): Mat2D {
  const size = Math.max(
    Math.abs(parent.a),
    Math.abs(parent.b),
    Math.abs(parent.c),
    Math.abs(parent.d),
  );
  if (size === 0)
    throw new TransformError(
      "CORE_SINGULAR_TRANSFORM",
      "A collapsed parent has no rotation basis.",
    );
  const a = parent.a / size,
    b = parent.b / size,
    c = parent.c / size,
    d = parent.d / size;
  const xLength = Math.hypot(a, b);
  const yLength = Math.hypot(c, d);
  // If X collapses, use Y to choose a deterministic right-handed basis.
  const x = xLength > TRANSFORM_EPSILON ? a / xLength : d / yLength;
  const y = xLength > TRANSFORM_EPSILON ? b / xLength : -c / yLength;
  const handedness = preserveReflection && a * d - b * c < 0 ? -1 : 1;
  return {
    a: x,
    b: y,
    c: -y * handedness,
    d: x * handedness,
    tx: parent.tx,
    ty: parent.ty,
  };
}

/** Filters both linear influence and the frame in which child translation lives. */
export function inheritanceFrame(
  parent: Readonly<Mat2D>,
  mode: TransformInheritance,
): Mat2D {
  checked(parent);
  switch (mode) {
    case "normal":
      return { ...parent };
    case "onlyTranslation":
      return { ...identityMatrix(), tx: parent.tx, ty: parent.ty };
    case "noScale":
      return rotationBasis(parent, true);
    case "noScaleOrReflection":
      return rotationBasis(parent, false);
    case "noRotationOrReflection": {
      const sx = Math.hypot(parent.a, parent.b);
      // QR residual removes shear and reflection without a UI decomposition.
      const sy =
        sx > 0
          ? Math.abs((parent.a / sx) * parent.d - (parent.b / sx) * parent.c)
          : Math.hypot(parent.c, parent.d);
      return checked({
        a: sx,
        b: 0,
        c: 0,
        d: sy,
        tx: parent.tx,
        ty: parent.ty,
      });
    }
    case "customPreserved":
      throw new TransformError(
        "CORE_UNSUPPORTED_INHERITANCE",
        "Custom preserved inheritance requires an explicit evaluator.",
      );
    default:
      throw new TransformError(
        "CORE_UNSUPPORTED_INHERITANCE",
        `Unknown inheritance mode: ${String(mode)}`,
      );
  }
}

export interface InheritanceEvaluator {
  compose(parent: Readonly<Mat2D>, local: Readonly<Transform2D>): Mat2D;
}
const strategy = (mode: SupportedInheritance): InheritanceEvaluator => ({
  compose: (parent, local) =>
    multiply(inheritanceFrame(parent, mode), localToMatrix(local)),
});
export const inheritanceStrategies: Readonly<
  Record<SupportedInheritance, InheritanceEvaluator>
> = Object.freeze({
  normal: strategy("normal"),
  onlyTranslation: strategy("onlyTranslation"),
  noRotationOrReflection: strategy("noRotationOrReflection"),
  noScale: strategy("noScale"),
  noScaleOrReflection: strategy("noScaleOrReflection"),
});

export function composeWorld(
  parent: Readonly<Mat2D> | null,
  local: Readonly<Transform2D>,
  mode: TransformInheritance = "normal",
): Mat2D {
  if (mode === "customPreserved")
    throw new TransformError(
      "CORE_UNSUPPORTED_INHERITANCE",
      "Custom preserved inheritance cannot be evaluated.",
    );
  return parent === null
    ? localToMatrix(local)
    : inheritanceStrategies[mode].compose(parent, local);
}

/** Authoring only: keeps the preferred rotation; encodes independent axis angles in shear. */
export function decomposeForAuthoring(
  matrix: Readonly<Mat2D>,
  preferredRotation = 0,
): Transform2D {
  checked(matrix);
  finiteValues(preferredRotation);
  const scaleX = Math.hypot(matrix.a, matrix.b);
  const yMagnitude = Math.hypot(matrix.c, matrix.d);
  const scaleY = isReflected(matrix) ? -yMagnitude : yMagnitude;
  const result = {
    x: matrix.tx,
    y: matrix.ty,
    rotation: preferredRotation,
    scaleX,
    scaleY,
    shearX:
      scaleX === 0 ? 0 : Math.atan2(matrix.b, matrix.a) - preferredRotation,
    shearY:
      scaleY === 0
        ? 0
        : Math.atan2(-matrix.c / scaleY, matrix.d / scaleY) - preferredRotation,
  };
  finiteValues(...Object.values(result));
  return result;
}

export function reparentPreserveWorld(
  oldWorld: Readonly<Mat2D>,
  newParent: Readonly<Mat2D> | null,
  preferredRotation = 0,
  mode: TransformInheritance = "normal",
): Transform2D {
  if (mode === "customPreserved")
    throw new TransformError(
      "CORE_UNSUPPORTED_INHERITANCE",
      "Cannot reparent an unsupported inheritance mode.",
    );
  const frame =
    newParent === null ? identityMatrix() : inheritanceFrame(newParent, mode);
  const inv = inverse(frame);
  if (!inv)
    throw new TransformError(
      "CORE_SINGULAR_TRANSFORM",
      "Reparenting requires an invertible inheritance frame.",
    );
  return decomposeForAuthoring(multiply(inv, oldWorld), preferredRotation);
}

/** Minimal transform-only hierarchy contract, independent of authored model schemas. */
export interface TransformBone {
  id: string;
  parentId?: string | undefined;
  setup: Transform2D;
  inherit: TransformInheritance;
}
export interface CompiledTransformHierarchy {
  bones: TransformBone[];
  parentIndices: number[];
  indexById: ReadonlyMap<string, number>;
  ids: string[];
}

export function compileTransformHierarchy(
  authored: readonly TransformBone[],
): CompiledTransformHierarchy {
  const byId = new Map<string, TransformBone>();
  for (const bone of authored) {
    if (byId.has(bone.id))
      throw new TransformError(
        "CORE_INVALID_HIERARCHY",
        `Duplicate bone ID: ${bone.id}`,
      );
    byId.set(bone.id, bone);
  }
  const children = new Map<string, TransformBone[]>();
  const ordered: TransformBone[] = [];
  for (const bone of authored) {
    if (bone.parentId === undefined) ordered.push(bone);
    else {
      if (!byId.has(bone.parentId))
        throw new TransformError(
          "CORE_INVALID_HIERARCHY",
          `Missing parent: ${bone.parentId}`,
        );
      const list = children.get(bone.parentId) ?? [];
      list.push(bone);
      children.set(bone.parentId, list);
    }
  }
  for (let i = 0; i < ordered.length; i++)
    ordered.push(...(children.get(ordered[i]!.id) ?? []));
  if (ordered.length !== authored.length)
    throw new TransformError(
      "CORE_INVALID_HIERARCHY",
      "Bone hierarchy contains a cycle.",
    );
  const bones = ordered.map((bone) => ({ ...bone, setup: { ...bone.setup } }));
  const indexById = new Map(bones.map((bone, i) => [bone.id, i]));
  return {
    bones,
    ids: bones.map((bone) => bone.id),
    indexById,
    parentIndices: bones.map((bone) =>
      bone.parentId === undefined ? -1 : indexById.get(bone.parentId)!,
    ),
  };
}

export function evaluateTransformHierarchy(
  hierarchy: CompiledTransformHierarchy,
): Mat2D[] {
  const world: Mat2D[] = [];
  hierarchy.bones.forEach((bone, i) => {
    const parentIndex = hierarchy.parentIndices[i];
    if (
      parentIndex === undefined ||
      !Number.isInteger(parentIndex) ||
      parentIndex < -1 ||
      parentIndex >= i
    )
      throw new TransformError(
        "CORE_INVALID_HIERARCHY",
        "Compiled parents must precede their children.",
      );
    world.push(
      composeWorld(
        parentIndex === -1 ? null : world[parentIndex]!,
        bone.setup,
        bone.inherit,
      ),
    );
  });
  return world;
}
