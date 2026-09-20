import { importSpine38 } from "@rigora/format-spine-38";
import type { ImportOptions, ImportResult } from "@rigora/format-common";

export const spine42CapabilityMatrix = {
  bones: "supported",
  slots: "supported",
  skins: "supported",
  regionAttachments: "supported",
  meshAttachments: "supported",
  animations: "supported",
  constraints: "preserved-by-common-mapping",
  physics: "runtime-only",
  textureMetadata: "preserved-when-provided",
} as const;

/** Imports the documented 4.2 core subset through a version-isolated adapter. */
export function importSpine42(
  text: string,
  options: ImportOptions,
): ImportResult {
  let source: Record<string, unknown>;
  try {
    source = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return importSpine38(text, options);
  }
  const skeleton = source.skeleton;
  if (!skeleton || typeof skeleton !== "object" || Array.isArray(skeleton))
    return importSpine38(text, options);
  const meta = { ...(skeleton as Record<string, unknown>) };
  const version = meta.spine;
  if (typeof version !== "string" || !version.startsWith("4.2"))
    return importSpine38(text, options);
  meta.spine = "3.8.99";
  const rawConstraints = Array.isArray(source.constraints)
    ? source.constraints
    : [];
  const physicsConstraints = rawConstraints.filter(
    (value): value is Record<string, unknown> =>
      !!value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      value.type === "physics",
  );
  const compatibleConstraints = rawConstraints.filter(
    (value) =>
      !(
        !!value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        value.type === "physics"
      ),
  );
  const compatible = JSON.stringify({ ...source, skeleton: meta });
  const compatibleSource = JSON.parse(compatible) as Record<string, unknown>;
  const topLevelPhysics = compatibleSource.physics;
  delete compatibleSource.physics;
  compatibleSource.constraints = compatibleConstraints;
  const result = importSpine38(JSON.stringify(compatibleSource), options);
  if (result.success) {
    for (const skeletonData of result.skeletons) {
      physicsConstraints.forEach((constraint, index) => {
        const boneName =
          typeof constraint.bone === "string" ? constraint.bone : undefined;
        const bone = skeletonData.bones.find(
          (candidate) => candidate.name === boneName,
        );
        if (!bone) return;
        skeletonData.constraints.push({
          id: `${options.namespace}:physics:${index}`,
          name:
            typeof constraint.name === "string"
              ? constraint.name
              : `physics-${index}`,
          type: "physics",
          order:
            typeof constraint.order === "number"
              ? constraint.order
              : skeletonData.constraints.length,
          boneId: bone.id,
          ...(typeof constraint.inertia === "number"
            ? { inertia: constraint.inertia }
            : {}),
          ...(typeof constraint.strength === "number"
            ? { strength: constraint.strength }
            : {}),
          ...(typeof constraint.damping === "number"
            ? { damping: constraint.damping }
            : {}),
          ...(typeof constraint.massInverse === "number"
            ? { massInverse: constraint.massInverse }
            : {}),
          ...(typeof constraint.wind === "number"
            ? { wind: constraint.wind }
            : {}),
          ...(typeof constraint.gravity === "number"
            ? { gravity: constraint.gravity }
            : {}),
          ...(typeof constraint.mix === "number"
            ? { mix: constraint.mix }
            : {}),
          sourceExtensions: {
            mapping: "approximated",
            sourceFieldCount: Object.keys(constraint).length,
          },
        });
      });
      skeletonData.source!.version = version;
      skeletonData.source!.warnings.push("SP42_CORE_SUBSET_ADAPTER");
      if (Array.isArray(topLevelPhysics))
        skeletonData.constraints.push(
          ...topLevelPhysics.map((payload, index) => ({
            id: `${options.namespace}:physics-preserved:${index}`,
            name: `physics-preserved-${index}`,
            type: "unknownPreserved" as const,
            order: skeletonData.constraints.length + index,
            sourceFormat: "spine-4.2-physics",
            payload: payload as any,
          })),
        );
      skeletonData.metadata = {
        ...(skeletonData.metadata ?? {}),
        spine42CapabilityMatrix,
      };
    }
    result.diagnostics.push({
      code: "SP42_CORE_SUBSET_ADAPTER",
      severity: "warning",
      message:
        "Spine 4.2 imported using the isolated core subset adapter; unsupported 4.2-only semantics remain explicit.",
      jsonPointer: "/skeleton/spine",
    });
  }
  if (Array.isArray(topLevelPhysics))
    result.diagnostics.push({
      code: "SP42_PHYSICS_PRESERVED",
      severity: "warning",
      message: "Top-level Spine 4.2 physics blocks are preserved explicitly.",
      jsonPointer: "/physics",
    });
  return result;
}
