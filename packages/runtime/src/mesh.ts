import {
  compileTransformHierarchy,
  evaluateTransformHierarchy,
  inverse,
  transformPoint,
  type Mat2D,
} from "@rigora/math";
import {
  validateSkeleton,
  type SkeletonData,
  type MeshAttachment,
} from "@rigora/model";
import { DeformTimeline } from "@rigora/animation";

export type DeformSpace = "slotLocal" | "influenceLocal" | "bindWorld";
export class MeshRuntimeError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "MeshRuntimeError";
  }
}
function fail(code: string, message: string): never {
  throw new MeshRuntimeError(code, message);
}

/** One mesh instance; buffers are instance-owned and reused between evaluations. */
export class MeshInstance {
  readonly worldXY: Float32Array;
  readonly deform: Float64Array;
  readonly uvs: Float32Array;
  readonly triangles: Uint32Array;
  readonly boneIds: readonly string[];
  readonly vertexCount: number;
  readonly deformTargetId: string;
  readonly #base: Float64Array;
  readonly #offsets: Uint32Array;
  readonly #bones: Uint32Array;
  readonly #weights: Float64Array;
  readonly #localXY: Float64Array;
  readonly #bindInverse: (Mat2D | null)[];
  readonly #slotIndex: number;
  readonly #weighted: boolean;
  readonly #scratch: Float32Array;
  readonly deformSpace: DeformSpace;

  constructor(
    skeleton: SkeletonData,
    readonly attachmentId: string,
    space?: DeformSpace,
  ) {
    const parsed = validateSkeleton(skeleton);
    if (!parsed.success)
      fail("RUNTIME_INVALID_MESH_MODEL", JSON.stringify(parsed.diagnostics));
    const data = parsed.data;
    const all = new Map<string, { mesh: MeshAttachment; slotId: string }>();
    for (const skin of data.skins)
      for (const [slotId, attachments] of Object.entries(skin.attachments))
        for (const attachment of attachments)
          if (attachment.type === "mesh")
            all.set(attachment.id, { mesh: attachment, slotId });
    const selected =
      all.get(attachmentId) ??
      fail("RUNTIME_MESH_NOT_FOUND", `Unknown mesh: ${attachmentId}`);
    let geometry = selected.mesh,
      owner = geometry.id;
    let inherits = true;
    while (geometry.linkedMeshId !== undefined) {
      if (
        geometry.vertices.length ||
        geometry.weightedVertices?.length ||
        geometry.uvs.length ||
        geometry.triangles.length
      )
        fail(
          "RUNTIME_LINKED_GEOMETRY_OVERRIDE",
          "Linked mesh must use empty geometry; overrides are not compiled.",
        );
      if (inherits && geometry.inheritDeform !== false)
        owner = geometry.linkedMeshId;
      else inherits = false;
      geometry = all.get(geometry.linkedMeshId)!.mesh;
    }
    this.deformTargetId = owner;
    const hierarchy = compileTransformHierarchy(data.bones);
    const bindWorld = evaluateTransformHierarchy(hierarchy);
    this.boneIds = Object.freeze([...hierarchy.ids]);
    this.#bindInverse = bindWorld.map((matrix) => inverse(matrix));
    this.#slotIndex = hierarchy.indexById.get(
      data.slots.find((slot) => slot.id === selected.slotId)!.boneId,
    )!;
    this.#weighted = geometry.weightedVertices !== undefined;
    this.deformSpace =
      space ?? (this.#weighted ? "influenceLocal" : "slotLocal");
    if (
      this.#weighted
        ? this.deformSpace !== "influenceLocal" &&
          this.deformSpace !== "bindWorld"
        : this.deformSpace !== "slotLocal"
    )
      fail(
        "RUNTIME_DEFORM_SPACE",
        "Deform space does not match the geometry type.",
      );
    this.vertexCount =
      geometry.weightedVertices?.length ?? geometry.vertices.length;
    this.#base = new Float64Array(this.vertexCount * 2);
    this.#offsets = new Uint32Array(this.vertexCount + 1);
    const bones: number[] = [],
      weights: number[] = [],
      localXY: number[] = [];
    if (geometry.weightedVertices)
      geometry.weightedVertices.forEach((vertex, i) => {
        this.#base[i * 2] = vertex.bindPosition.x;
        this.#base[i * 2 + 1] = vertex.bindPosition.y;
        this.#offsets[i] = bones.length;
        const sum = vertex.influences.reduce(
          (total, influence) => total + influence.weight,
          0,
        );
        if (!(sum > 0))
          fail("RUNTIME_INVALID_WEIGHTS", "Weight sum must be positive.");
        const normalized = vertex.influences.map(
          (influence) => influence.weight / sum,
        );
        let largest = 0;
        for (let j = 1; j < normalized.length; j++)
          if (normalized[j]! > normalized[largest]!) largest = j;
        normalized[largest] =
          normalized[largest]! + (1 - normalized.reduce((a, b) => a + b, 0));
        vertex.influences.forEach((influence, j) => {
          const index = hierarchy.indexById.get(influence.boneId)!;
          const inv = this.#bindInverse[index];
          if (
            (!influence.localPosition || this.deformSpace === "bindWorld") &&
            !inv
          )
            fail(
              "RUNTIME_SINGULAR_BIND",
              `Cannot invert bind bone ${influence.boneId}.`,
            );
          const position =
            influence.localPosition ??
            transformPoint(inv!, vertex.bindPosition);
          bones.push(index);
          weights.push(normalized[j]!);
          localXY.push(position.x, position.y);
        });
      });
    else
      geometry.vertices.forEach((vertex, i) => {
        this.#base[i * 2] = vertex.x;
        this.#base[i * 2 + 1] = vertex.y;
      });
    this.#offsets[this.vertexCount] = bones.length;
    this.#bones = Uint32Array.from(bones);
    this.#weights = Float64Array.from(weights);
    this.#localXY = Float64Array.from(localXY);
    this.deform = new Float64Array(
      (this.deformSpace === "influenceLocal"
        ? bones.length
        : this.vertexCount) * 2,
    );
    this.worldXY = new Float32Array(this.vertexCount * 2);
    this.#scratch = new Float32Array(this.worldXY.length);
    this.uvs = Float32Array.from(geometry.uvs.flatMap((uv) => [uv.x, uv.y]));
    if (!this.uvs.every(Number.isFinite))
      fail("RUNTIME_MESH_OVERFLOW", "UVs exceed Float32 range.");
    this.triangles = Uint32Array.from(geometry.triangles);
  }

  /** Pose matrices must use boneIds order and already include constraints. Y remains up. */
  evaluate(world: readonly Readonly<Mat2D>[]): Float32Array {
    if (world.length !== this.boneIds.length)
      fail("RUNTIME_POSE_SIZE", "Bone matrix count mismatch.");
    for (const m of world)
      if (
        !Number.isFinite(m.a) ||
        !Number.isFinite(m.b) ||
        !Number.isFinite(m.c) ||
        !Number.isFinite(m.d) ||
        !Number.isFinite(m.tx) ||
        !Number.isFinite(m.ty)
      )
        fail("RUNTIME_NON_FINITE_POSE", "Pose must be finite.");
    for (const value of this.deform)
      if (!Number.isFinite(value))
        fail("RUNTIME_NON_FINITE_DEFORM", "Deform must be finite.");
    for (let v = 0; v < this.vertexCount; v++) {
      let x = 0,
        y = 0;
      if (!this.#weighted) {
        const m = world[this.#slotIndex]!,
          lx = this.#base[v * 2]! + this.deform[v * 2]!,
          ly = this.#base[v * 2 + 1]! + this.deform[v * 2 + 1]!;
        x = m.a * lx + m.c * ly + m.tx;
        y = m.b * lx + m.d * ly + m.ty;
      } else
        for (let j = this.#offsets[v]!; j < this.#offsets[v + 1]!; j++) {
          const index = this.#bones[j]!,
            m = world[index]!;
          let dx: number, dy: number;
          if (this.deformSpace === "influenceLocal") {
            dx = this.deform[j * 2]!;
            dy = this.deform[j * 2 + 1]!;
          } else {
            const inv = this.#bindInverse[index]!,
              vx = this.deform[v * 2]!,
              vy = this.deform[v * 2 + 1]!;
            dx = inv.a * vx + inv.c * vy;
            dy = inv.b * vx + inv.d * vy;
          }
          const lx = this.#localXY[j * 2]! + dx,
            ly = this.#localXY[j * 2 + 1]! + dy,
            weight = this.#weights[j]!;
          x += (m.a * lx + m.c * ly + m.tx) * weight;
          y += (m.b * lx + m.d * ly + m.ty) * weight;
        }
      this.#scratch[v * 2] = x;
      this.#scratch[v * 2 + 1] = y;
      if (
        !Number.isFinite(this.#scratch[v * 2]) ||
        !Number.isFinite(this.#scratch[v * 2 + 1])
      )
        fail("RUNTIME_MESH_OVERFLOW", "World vertices exceed Float32 range.");
    }
    this.worldXY.set(this.#scratch);
    return this.worldXY;
  }
  sampleAndEvaluate(
    time: number,
    world: readonly Readonly<Mat2D>[],
    timeline?: DeformTimeline,
  ): Float32Array {
    if (timeline) {
      if (
        timeline.targetId !== this.deformTargetId ||
        timeline.scalarCount !== this.deform.length
      )
        fail(
          "RUNTIME_DEFORM_TARGET",
          "Timeline target or scalar domain does not match mesh deform owner.",
        );
      timeline.sampleInto(time, this.deform);
    } else this.deform.fill(0);
    return this.evaluate(world);
  }
}
