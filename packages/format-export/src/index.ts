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
    warnings: plan.issues.map((i) => i.message),
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
  skins: Record<string, unknown>;
  animations: Record<string, unknown>;
  events: Record<string, unknown>;
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
  validateForExport(skeleton);
  const plan = createExportPlan(
    skeleton,
    profile === "3.8.75" ? "spine-3.8.75" : "spine-3.8",
  );
  if (plan.blockers.length) throw new Error("EXPORT_PLAN_BLOCKED");
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
    skins: Object.fromEntries(
      skeleton.skins.map((s) => [
        s.name,
        Object.fromEntries(
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
                      }
                    : { name: a.name, type: a.type },
              ]),
            ),
          ]),
        ),
      ]),
    ),
    animations: Object.fromEntries(
      skeleton.animations.map((a) => [a.name, {}]),
    ),
    events: Object.fromEntries(
      skeleton.events.map((e) => [e.name, e.defaults ?? {}]),
    ),
  };
}
export function serializeSpine38(
  skeleton: SkeletonData,
  profile: "3.8" | "3.8.75" = "3.8",
): string {
  return JSON.stringify(toSpine38Ast(skeleton, profile));
}
