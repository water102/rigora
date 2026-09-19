import {
  skeletonSchema,
  type SkeletonData,
  type AttachmentData,
} from "./schema.js";
import { meshInvariants } from "./mesh-invariants.js";

export interface ModelDiagnostic {
  code: string;
  severity: "error" | "warning";
  message: string;
  jsonPointer: string;
}
export type ValidationResult =
  | { success: true; data: SkeletonData; diagnostics: ModelDiagnostic[] }
  | { success: false; diagnostics: ModelDiagnostic[] };
const pointer = (parts: (string | number)[]) =>
  "/" +
  parts
    .map((part) => String(part).replaceAll("~", "~0").replaceAll("/", "~1"))
    .join("/");

/** Untrusted input enters here. Shape validation precedes graph traversal. */
export function validateSkeleton(input: unknown): ValidationResult {
  // Guard recursive schemas against cyclic/deep JavaScript values before parsing.
  const active = new Set<object>();
  const checkJson = (value: unknown, depth: number): boolean => {
    if (depth > 100) return false;
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean"
    )
      return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value !== "object" || active.has(value)) return false;
    if (
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    )
      return false;
    active.add(value);
    const valid = Object.values(value).every((child) =>
      checkJson(child, depth + 1),
    );
    active.delete(value);
    return valid;
  };
  if (!checkJson(input, 0))
    return {
      success: false,
      diagnostics: [
        {
          code: "CORE_INVALID_JSON",
          severity: "error",
          message:
            "Expected finite JSON data without cycles, at most 100 levels deep.",
          jsonPointer: "",
        },
      ],
    };
  const parsed = skeletonSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      diagnostics: parsed.error.issues.map((issue) => ({
        code: "CORE_INVALID_SCHEMA",
        severity: "error",
        message: issue.message,
        jsonPointer: pointer(issue.path),
      })),
    };
  const data = parsed.data;
  const diagnostics: ModelDiagnostic[] = [];
  const add = (
    code: string,
    message: string,
    path: string,
    severity: "error" | "warning" = "error",
  ) => diagnostics.push({ code, severity, message, jsonPointer: path });
  const ids = new Set<string>();
  const register = (value: { id: string }, path: string) => {
    if (ids.has(value.id))
      add("CORE_DUPLICATE_ID", `Duplicate ID: ${value.id}`, path + "/id");
    ids.add(value.id);
  };
  register(data, "");
  const bones = new Set(data.bones.map((bone) => bone.id));
  const slots = new Set(data.slots.map((slot) => slot.id));
  const constraints = new Set(data.constraints.map((item) => item.id));
  const attachments = new Map<string, AttachmentData>();
  const slotAttachments = new Map<string, Set<string>>();
  const ref = (
    value: string | undefined,
    targets: Set<string>,
    path: string,
  ) => {
    if (value !== undefined && !targets.has(value))
      add("CORE_INVALID_REFERENCE", `Unresolved reference: ${value}`, path);
  };
  const cycles = (
    edges: Map<string, string | undefined>,
    code: string,
    path: string,
  ) => {
    const finished = new Set<string>();
    for (const start of edges.keys()) {
      const active = new Set<string>();
      let current: string | undefined = start;
      while (
        current !== undefined &&
        edges.has(current) &&
        !finished.has(current)
      ) {
        if (active.has(current)) {
          add(code, `Cycle at ${current}`, path);
          break;
        }
        active.add(current);
        current = edges.get(current);
      }
      for (const key of active) finished.add(key);
    }
  };
  data.bones.forEach((bone, i) => {
    register(bone, `/bones/${i}`);
    ref(bone.parentId, bones, `/bones/${i}/parentId`);
  });
  cycles(
    new Map(data.bones.map((bone) => [bone.id, bone.parentId])),
    "CORE_CYCLIC_BONE_HIERARCHY",
    "/bones",
  );
  data.slots.forEach((slot, i) => {
    register(slot, `/slots/${i}`);
    ref(slot.boneId, bones, `/slots/${i}/boneId`);
  });
  data.constraints.forEach((item, i) => {
    const path = `/constraints/${i}`;
    register(item, path);
    if ("boneIds" in item)
      item.boneIds.forEach((value, j) =>
        ref(value, bones, `${path}/boneIds/${j}`),
      );
    if ("targetBoneId" in item)
      ref(item.targetBoneId, bones, path + "/targetBoneId");
    if ("boneId" in item) ref(item.boneId, bones, path + "/boneId");
    if ("targetSlotId" in item)
      ref(item.targetSlotId, slots, path + "/targetSlotId");
    if (item.type === "unknownPreserved")
      add(
        "CORE_UNSUPPORTED_BEHAVIOR",
        "Preserved constraint has no evaluator.",
        path,
        "warning",
      );
  });
  data.skins.forEach((skin, i) => {
    const path = `/skins/${i}`;
    register(skin, path);
    skin.requiredBoneIds?.forEach((value, j) =>
      ref(value, bones, `${path}/requiredBoneIds/${j}`),
    );
    skin.requiredConstraintIds?.forEach((value, j) =>
      ref(value, constraints, `${path}/requiredConstraintIds/${j}`),
    );
    for (const [slotId, values] of Object.entries(skin.attachments)) {
      const slotPath = path + "/attachments" + pointer([slotId]);
      ref(slotId, slots, slotPath);
      const owned = slotAttachments.get(slotId) ?? new Set<string>();
      slotAttachments.set(slotId, owned);
      values.forEach((item, j) => {
        const at = `${slotPath}/${j}`;
        register(item, at);
        attachments.set(item.id, item);
        owned.add(item.id);
        if (item.type === "clipping")
          ref(item.endSlotId, slots, at + "/endSlotId");
        if (item.type === "unknownPreserved")
          add(
            "CORE_UNSUPPORTED_BEHAVIOR",
            "Preserved attachment has no evaluator.",
            at,
            "warning",
          );
        const weighted =
          item.type === "mesh"
            ? item.weightedVertices
            : item.type === "path"
              ? item.vertices.filter((vertex) => "influences" in vertex)
              : undefined;
        weighted?.forEach((vertex, k) => {
          const wp = `${at}/${item.type === "mesh" ? "weightedVertices" : "vertices"}/${k}`;
          const sum = vertex.influences.reduce(
            (total, influence) => total + influence.weight,
            0,
          );
          if (Math.abs(sum - 1) > 1e-5)
            add(
              "CORE_WEIGHT_SUM_INVALID",
              `Expected weight sum 1, got ${sum}`,
              wp,
            );
          const influenceBones = new Set<string>();
          vertex.influences.forEach((influence, n) => {
            ref(influence.boneId, bones, `${wp}/influences/${n}/boneId`);
            if (influenceBones.has(influence.boneId))
              add(
                "CORE_DUPLICATE_INFLUENCE",
                "Each vertex may reference a bone only once.",
                `${wp}/influences/${n}/boneId`,
              );
            influenceBones.add(influence.boneId);
          });
        });
        if (item.type === "mesh") {
          for (const issue of meshInvariants(item))
            add(issue.code, issue.message, at + issue.path);
        }
      });
    }
  });
  const meshes = new Set(
    [...attachments.values()]
      .filter((item) => item.type === "mesh")
      .map((item) => item.id),
  );
  const links = new Map<string, string | undefined>();
  for (const item of attachments.values())
    if (item.type === "mesh") {
      ref(item.linkedMeshId, meshes, "/skins");
      links.set(item.id, item.linkedMeshId);
    }
  cycles(links, "CORE_CYCLIC_LINKED_MESH", "/skins");
  data.slots.forEach((slot, i) =>
    ref(
      slot.setupAttachmentId,
      slotAttachments.get(slot.id) ?? new Set(),
      `/slots/${i}/setupAttachmentId`,
    ),
  );
  data.events.forEach((event, i) => register(event, `/events/${i}`));
  data.animations.forEach((animation, i) => {
    register(animation, `/animations/${i}`);
    animation.timelines.forEach((timeline, j) => {
      const path = `/animations/${i}/timelines/${j}`;
      register(timeline, path);
      const targets = timeline.type.startsWith("bone.")
        ? bones
        : timeline.type.startsWith("slot.")
          ? slots
          : timeline.type === "deform"
            ? meshes
            : /^(ik|transform|path|physics)\./.test(timeline.type)
              ? constraints
              : undefined;
      if (targets && timeline.targetId === undefined)
        add(
          "CORE_INVALID_REFERENCE",
          "Timeline requires a target.",
          path + "/targetId",
        );
      ref(timeline.targetId, targets ?? ids, path + "/targetId");
      timeline.keyframes.forEach((frame, k) => {
        if (
          frame.time > animation.duration ||
          (k > 0 && frame.time < timeline.keyframes[k - 1]!.time)
        )
          add(
            "CORE_INVALID_TIME_ORDER",
            "Keyframes must be ordered and within animation duration.",
            `${path}/keyframes/${k}/time`,
          );
      });
    });
  });
  return diagnostics.some((item) => item.severity === "error")
    ? { success: false, diagnostics }
    : { success: true, data, diagnostics };
}
