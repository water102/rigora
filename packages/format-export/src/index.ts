import {
  validateSkeleton,
  type AttachmentData,
  type SkeletonData,
} from "@rigora/model";

export type ExportAction = "native" | "convert" | "bake" | "drop" | "block";
export interface ExportIssue {
  entityId: string;
  entityType: string;
  feature: string;
  action: ExportAction;
  message: string;
}
export interface ExportPlan {
  target: "spine-3.8" | "spine-3.8.75" | "dragonbones-5.5";
  issues: ExportIssue[];
  blockers: ExportIssue[];
}
export interface CapabilityEntry {
  entityId: string;
  feature: string;
  action: ExportAction;
}
export function scanExportCapabilities(
  skeleton: SkeletonData,
  target: ExportPlan["target"],
): CapabilityEntry[] {
  const entries: CapabilityEntry[] = [];
  for (const skin of skeleton.skins)
    for (const list of Object.values(skin.attachments))
      for (const attachment of list) {
        const action: ExportAction =
          attachment.type === "unknownPreserved" ||
          attachment.type === "nestedSkeleton"
            ? "block"
            : target.startsWith("dragonbones") &&
                ["clipping", "boundingBox", "path"].includes(attachment.type)
              ? "bake"
              : attachment.type === "point" && target.startsWith("spine")
                ? "convert"
                : "native";
        entries.push({
          entityId: attachment.id,
          feature: attachment.type,
          action,
        });
      }
  for (const constraint of skeleton.constraints)
    entries.push({
      entityId: constraint.id,
      feature: constraint.type,
      action:
        constraint.type === "physics"
          ? target.startsWith("spine")
            ? "bake"
            : "drop"
          : constraint.type === "unknownPreserved"
            ? "block"
            : "native",
    });
  for (const animation of skeleton.animations)
    entries.push({
      entityId: animation.id,
      feature: "animation",
      action: "native",
    });
  for (const event of skeleton.events)
    entries.push({ entityId: event.id, feature: "event", action: "native" });
  return entries;
}
export interface ExportReport {
  target: ExportPlan["target"];
  conversions: string[];
  bakes: string[];
  drops: string[];
  warnings: string[];
  checksum: string;
}

function attachments(skeleton: SkeletonData) {
  return skeleton.skins.flatMap((skin) =>
    Object.values(skin.attachments).flat(),
  );
}
export function createExportPlan(
  skeleton: SkeletonData,
  target: ExportPlan["target"],
): ExportPlan {
  const issues: ExportIssue[] = [];
  const issue = (
    a: AttachmentData,
    feature: string,
    action: ExportAction,
    message: string,
  ) =>
    issues.push({
      entityId: a.id,
      entityType: "attachment",
      feature,
      action,
      message,
    });
  for (const a of attachments(skeleton)) {
    if (a.type === "unknownPreserved" || a.type === "nestedSkeleton")
      issue(
        a,
        a.type,
        "block",
        "This semantic has no lossless target representation.",
      );
    if (
      target.startsWith("dragonbones") &&
      (a.type === "clipping" || a.type === "boundingBox" || a.type === "path")
    )
      issue(a, a.type, "bake", "Bake attachment geometry for DragonBones 5.5.");
    if (target.startsWith("spine") && a.type === "point")
      issue(
        a,
        a.type,
        "convert",
        "Convert point attachment to Spine compatible metadata.",
      );
  }
  for (const c of skeleton.constraints)
    if (c.type === "physics")
      issues.push({
        entityId: c.id,
        entityType: "constraint",
        feature: "physics",
        action: target.startsWith("spine") ? "bake" : "drop",
        message: "Physics requires explicit baking or approved removal.",
      });
  return {
    target,
    issues,
    blockers: issues.filter((x) => x.action === "block"),
  };
}
export function assertExportable(
  plan: ExportPlan,
  approved: ReadonlySet<string> = new Set(),
): void {
  const unresolved = plan.issues.filter(
    (i) =>
      (i.action === "block" || i.action === "bake" || i.action === "drop") &&
      !approved.has(i.entityId),
  );
  if (unresolved.length)
    throw new Error(
      `EXPORT_PLAN_UNRESOLVED:${unresolved.map((i) => i.entityId).join(",")}`,
    );
}
export function createExportReport(
  skeleton: SkeletonData,
  plan: ExportPlan,
  approved = new Set<string>(),
): ExportReport {
  assertExportable(plan, approved);
  const canonical = JSON.stringify(skeleton);
  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i++)
    hash = Math.imul(hash ^ canonical.charCodeAt(i), 16777619);
  return {
    target: plan.target,
    conversions: plan.issues
      .filter((i) => i.action === "convert")
      .map((i) => i.feature),
    bakes: plan.issues.filter((i) => i.action === "bake").map((i) => i.feature),
    drops: plan.issues.filter((i) => i.action === "drop").map((i) => i.feature),
    warnings: [
      ...(plan.target === "spine-3.8.75"
        ? ["Exact Spine 3.8.75 profile requires golden verification."]
        : []),
      ...plan.issues.map((i) => i.message),
    ],
    checksum: (hash >>> 0).toString(16).padStart(8, "0"),
  };
}
export function validateForExport(skeleton: SkeletonData): void {
  const result = validateSkeleton(skeleton);
  if (!result.success) throw new Error("EXPORT_INVALID_CANONICAL_MODEL");
}

export interface Spine38Ast {
  skeleton: {
    hash: string;
    spine: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fps: number;
  };
  bones: unknown[];
  slots: unknown[];
  skins: unknown[];
  animations?: Record<string, unknown>;
  events?: Record<string, unknown>;
  constraints?: unknown[];
}
const round = (n: number) => Number(n.toFixed(6));
const color = (c: { r: number; g: number; b: number; a: number }) =>
  [c.r, c.g, c.b, c.a]
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
export function toSpine38Ast(
  skeleton: SkeletonData,
  profile: "3.8" | "3.8.75" = "3.8",
): Spine38Ast {
  const plan = createExportPlan(
    skeleton,
    profile === "3.8.75" ? "spine-3.8.75" : "spine-3.8",
  );
  if (plan.blockers.length) throw new Error("EXPORT_PLAN_BLOCKED");
  assertExportable(plan);
  validateForExport(skeleton);
  return {
    skeleton: {
      hash: skeleton.id,
      spine: profile,
      x: round(skeleton.bounds?.x ?? 0),
      y: round(skeleton.bounds?.y ?? 0),
      width: round(skeleton.bounds?.width ?? 0),
      height: round(skeleton.bounds?.height ?? 0),
      fps: round(skeleton.fps),
    },
    bones: skeleton.bones.map((b) => ({
      name: b.name,
      ...(b.parentId
        ? { parent: skeleton.bones.find((p) => p.id === b.parentId)?.name }
        : {}),
      x: round(b.setup.x),
      y: round(b.setup.y),
      rotation: round((b.setup.rotation * 180) / Math.PI),
      scaleX: round(b.setup.scaleX),
      scaleY: round(b.setup.scaleY),
      length: round(b.length),
    })),
    slots: skeleton.slots.map((s) => ({
      name: s.name,
      bone: skeleton.bones.find((b) => b.id === s.boneId)?.name,
      attachment: skeleton.skins[0]?.attachments[s.id]?.find(
        (a) => a.id === s.setupAttachmentId,
      )?.name,
      color: color(s.color),
      blend: s.blendMode,
    })),
    skins: skeleton.skins.map((s) => ({
      name: s.name,
      attachments: Object.fromEntries(
        Object.entries(s.attachments).map(([slot, as]) => [
          skeleton.slots.find((x) => x.id === slot)?.name ?? slot,
          Object.fromEntries(
            as.map((a) => [
              a.name,
              a.type === "region"
                ? {
                    name: a.name,
                    path: a.name,
                    x: round(a.transform.x),
                    y: round(a.transform.y),
                    rotation: round((a.transform.rotation * 180) / Math.PI),
                    width: round(a.width),
                    height: round(a.height),
                  }
                : a.type === "mesh"
                  ? {
                      name: a.name,
                      type: "mesh",
                      uvs: a.uvs.flatMap((v) => [round(v.x), round(v.y)]),
                      triangles: a.triangles,
                      vertices: a.vertices.flatMap((v) => [
                        round(v.x),
                        round(v.y),
                      ]),
                      ...(a.weightedVertices
                        ? {
                            weights: a.weightedVertices.map((vertex) => ({
                              bindPosition: vertex.bindPosition,
                              influences: vertex.influences.map(
                                (influence) => ({
                                  ...influence,
                                  boneId:
                                    skeleton.bones.find(
                                      (bone) => bone.id === influence.boneId,
                                    )?.name ?? influence.boneId,
                                }),
                              ),
                            })),
                          }
                        : {}),
                    }
                  : { name: a.name, type: a.type },
            ]),
          ),
        ]),
      ),
    })),
    ...(skeleton.animations.length
      ? {
          animations: Object.fromEntries(
            skeleton.animations.map((animation) => [
              animation.name,
              Object.fromEntries(
                animation.timelines.map((timeline) => [
                  timeline.type,
                  {
                    target:
                      skeleton.bones.find(
                        (bone) => bone.id === timeline.targetId,
                      )?.name ?? timeline.targetId,
                    keys: timeline.keyframes.map((key) => ({
                      time: round(key.time),
                      value: key.value,
                      curve: key.curve,
                    })),
                  },
                ]),
              ),
            ]),
          ),
        }
      : {}),
    ...(skeleton.events.length
      ? {
          events: Object.fromEntries(
            skeleton.events.map((event) => [event.name, event.defaults ?? {}]),
          ),
        }
      : {}),
    ...(skeleton.constraints.length
      ? {
          constraints: skeleton.constraints
            .filter((constraint) => constraint.type !== "physics")
            .map((constraint) => ({
              name: constraint.name,
              type: constraint.type,
              order: constraint.order,
              ...(constraint.type === "ik"
                ? {
                    target: skeleton.bones.find(
                      (b) => b.id === constraint.targetBoneId,
                    )?.name,
                    bones: constraint.boneIds.map(
                      (id) => skeleton.bones.find((b) => b.id === id)?.name,
                    ),
                    mix: constraint.mix,
                    bendPositive: constraint.bendDirection === 1,
                  }
                : {}),
              ...(constraint.type === "path"
                ? {
                    target: skeleton.slots.find(
                      (slot) => slot.id === constraint.targetSlotId,
                    )?.name,
                    bones: constraint.boneIds.map(
                      (id) =>
                        skeleton.bones.find((bone) => bone.id === id)?.name,
                    ),
                    position: constraint.position,
                    spacing: constraint.spacing,
                  }
                : {}),
            })),
        }
      : {}),
  };
}
export function serializeSpine38(
  skeleton: SkeletonData,
  profile: "3.8" | "3.8.75" = "3.8",
): string {
  return JSON.stringify(toSpine38Ast(skeleton, profile));
}

export interface DragonBones55Ast {
  version: "5.5";
  name: string;
  frameRate: number;
  armature: unknown[];
}
export function toDragonBones55Ast(skeleton: SkeletonData): DragonBones55Ast {
  validateForExport(skeleton);
  const plan = createExportPlan(skeleton, "dragonbones-5.5");
  if (plan.blockers.length) throw new Error("EXPORT_PLAN_BLOCKED");
  return {
    version: "5.5",
    name: skeleton.name,
    frameRate: round(skeleton.fps),
    armature: [
      {
        name: skeleton.name,
        type: "Armature",
        frameRate: round(skeleton.fps),
        bone: skeleton.bones.map((b) => ({
          name: b.name,
          ...(b.parentId
            ? { parent: skeleton.bones.find((p) => p.id === b.parentId)?.name }
            : {}),
          length: round(b.length),
          transform: {
            x: round(b.setup.x),
            y: round(-b.setup.y),
            skX: round((-b.setup.shearY * 180) / Math.PI),
            skY: round((-b.setup.shearX * 180) / Math.PI),
            scX: round(b.setup.scaleX),
            scY: round(b.setup.scaleY),
          },
        })),
        slot: skeleton.slots.map((s) => ({
          name: s.name,
          parent: skeleton.bones.find((b) => b.id === s.boneId)?.name,
          displayIndex: s.setupAttachmentId ? 0 : -1,
          blendMode: s.blendMode === "additive" ? "add" : s.blendMode,
        })),
        skin: skeleton.skins.map((skin) => ({
          name: skin.name,
          slot: Object.entries(skin.attachments).map(([slotId, as]) => ({
            name: skeleton.slots.find((s) => s.id === slotId)?.name,
            display: as.map((a) => ({
              name: a.name,
              path: a.name,
              type: a.type === "region" ? "image" : a.type,
            })),
          })),
        })),
      },
    ],
  };
}
export function serializeDragonBones55(skeleton: SkeletonData): string {
  return JSON.stringify(toDragonBones55Ast(skeleton));
}

export interface AtlasRegionPlan {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: boolean;
}
export function planDeterministicAtlas(
  regions: readonly { name: string; width: number; height: number }[],
  pageWidth = 2048,
  allowRotation = true,
): AtlasRegionPlan[] {
  let x = 0,
    y = 0,
    row = 0;
  return [...regions]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((r) => {
      const rotate =
        allowRotation &&
        r.width > r.height &&
        x + r.width > pageWidth &&
        x + r.height <= pageWidth;
      const width = rotate ? r.height : r.width;
      const height = rotate ? r.width : r.height;
      if (x + width > pageWidth) {
        x = 0;
        y += row;
        row = 0;
      }
      const result = {
        name: r.name,
        x,
        y,
        width,
        height,
        rotate,
      };
      x += width;
      row = Math.max(row, height);
      return result;
    });
}

export interface CrossFormatReport {
  path: string[];
  losses: ExportIssue[];
  checksums: string[];
}
export function createCrossFormatReport(
  skeleton: SkeletonData,
  first: ExportPlan["target"],
  second: ExportPlan["target"],
): CrossFormatReport {
  const a = createExportPlan(skeleton, first);
  const b = createExportPlan(skeleton, second);
  const reportA = createExportReport(
    skeleton,
    a,
    new Set(
      a.issues.filter((i) => i.action !== "block").map((i) => i.entityId),
    ),
  );
  const reportB = createExportReport(
    skeleton,
    b,
    new Set(
      b.issues.filter((i) => i.action !== "block").map((i) => i.entityId),
    ),
  );
  return {
    path: [first, "hnn", second],
    losses: [...a.issues, ...b.issues].filter(
      (i) => i.action === "drop" || i.action === "bake",
    ),
    checksums: [reportA.checksum, reportB.checksum],
  };
}

export interface ExportArtifact {
  bytes: Uint8Array;
  report: ExportReport;
}
export class ExportPlannerSession {
  readonly plan: ExportPlan;
  private readonly approved = new Set<string>();
  constructor(
    readonly skeleton: SkeletonData,
    target: ExportPlan["target"],
  ) {
    this.plan = createExportPlan(skeleton, target);
  }
  approve(entityId: string): void {
    if (!this.plan.issues.some((issue) => issue.entityId === entityId))
      throw new Error(`EXPORT_PLAN_UNKNOWN_ENTITY:${entityId}`);
    this.approved.add(entityId);
  }
  reject(entityId: string): void {
    this.approved.delete(entityId);
  }
  unresolved(): ExportIssue[] {
    return this.plan.issues.filter(
      (issue) =>
        (issue.action === "block" ||
          issue.action === "bake" ||
          issue.action === "drop") &&
        !this.approved.has(issue.entityId),
    );
  }
  export(): ExportArtifact {
    return exportSkeleton(this.skeleton, this.plan.target, this.approved);
  }
}
export interface RoundTripMismatch {
  path: string;
  expected: unknown;
  actual: unknown;
}
export function compareRoundTripSemantics(
  expected: SkeletonData,
  actual: SkeletonData,
): RoundTripMismatch[] {
  const mismatches: RoundTripMismatch[] = [];
  const compare = (path: string, left: unknown, right: unknown) => {
    if (JSON.stringify(left) !== JSON.stringify(right))
      mismatches.push({ path, expected: left, actual: right });
  };
  compare(
    "/bones/names",
    expected.bones.map((b) => b.name),
    actual.bones.map((b) => b.name),
  );
  compare(
    "/slots/names",
    expected.slots.map((s) => s.name),
    actual.slots.map((s) => s.name),
  );
  compare(
    "/skins/names",
    expected.skins.map((s) => s.name),
    actual.skins.map((s) => s.name),
  );
  compare(
    "/attachments/count",
    expected.skins.flatMap((s) => Object.values(s.attachments)).flat().length,
    actual.skins.flatMap((s) => Object.values(s.attachments)).flat().length,
  );
  expected.bones.forEach((bone, index) => {
    const other = actual.bones[index];
    if (other)
      compare(
        `/bones/${index}/setup`,
        [bone.setup.x, bone.setup.y, bone.length],
        [other.setup.x, other.setup.y, other.length],
      );
  });
  return mismatches;
}
export function exportSkeleton(
  skeleton: SkeletonData,
  target: ExportPlan["target"],
  approved = new Set<string>(),
): ExportArtifact {
  const plan = createExportPlan(skeleton, target);
  assertExportable(plan, approved);
  const text = target.startsWith("spine")
    ? serializeSpine38(skeleton, target === "spine-3.8.75" ? "3.8.75" : "3.8")
    : serializeDragonBones55(skeleton);
  return {
    bytes: new TextEncoder().encode(text),
    report: createExportReport(skeleton, plan, approved),
  };
}
