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
