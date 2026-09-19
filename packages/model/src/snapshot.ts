import { validateSkeleton } from "./validation.js";
import type { SkeletonData } from "./schema.js";

/** Test snapshot, not the production .hbone ZIP container. */
export function serializeSkeletonSnapshot(input: unknown): string {
  const result = validateSkeleton(input);
  if (!result.success) throw new Error(JSON.stringify(result.diagnostics));
  return (
    JSON.stringify(
      {
        format: "hnn-skeleton-snapshot",
        formatVersion: 1,
        skeleton: result.data,
      },
      (_key, value: unknown) => {
        if (
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value)
        )
          return Object.fromEntries(
            Object.entries(value).sort(([a], [b]) =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
          );
        return value;
      },
      2,
    ) + "\n"
  );
}

export function parseSkeletonSnapshot(text: string): SkeletonData {
  const envelope: unknown = JSON.parse(text);
  if (
    envelope === null ||
    typeof envelope !== "object" ||
    !("format" in envelope) ||
    envelope.format !== "hnn-skeleton-snapshot" ||
    !("formatVersion" in envelope) ||
    envelope.formatVersion !== 1 ||
    !("skeleton" in envelope)
  )
    throw new Error("NATIVE_INVALID_SNAPSHOT: unsupported snapshot envelope");
  const result = validateSkeleton(envelope.skeleton);
  if (!result.success) throw new Error(JSON.stringify(result.diagnostics));
  return result.data;
}
