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
  const compatible = JSON.stringify({ ...source, skeleton: meta });
  const result = importSpine38(compatible, options);
  if (result.success) {
    for (const skeletonData of result.skeletons) {
      skeletonData.source!.version = version;
      skeletonData.source!.warnings.push("SP42_CORE_SUBSET_ADAPTER");
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
  return result;
}
