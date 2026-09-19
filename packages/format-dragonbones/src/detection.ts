export interface DragonBonesVersionDetection {
  family: "5.5" | "6.0" | "unknown";
  exact?: string;
  code?: string;
}
export interface DragonBonesFeatureDiagnostic {
  code: "DB60_UNSUPPORTED_FEATURE";
  severity: "error";
  message: string;
  jsonPointer: string;
  suggestedAction: string;
}
const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
export function detectDragonBonesVersion(
  input: unknown,
): DragonBonesVersionDetection {
  if (!isObject(input) || input["version"] === undefined)
    return { family: "unknown", code: "DB_VERSION_MISSING" };
  const version = input["version"];
  if (typeof version !== "string" || !/^\d+\.\d+(?:\.\d+)?$/.test(version))
    return { family: "unknown", code: "DB_VERSION_INVALID" };
  const family = version.split(".").slice(0, 2).join(".");
  return {
    family: family === "5.5" || family === "6.0" ? family : "unknown",
    exact: version,
  };
}

/** Recognizes extension-bearing schema locations without interpreting constraints. */
export function inspectDragonBonesExtensions(
  input: unknown,
): DragonBonesFeatureDiagnostic[] {
  const diagnostics: DragonBonesFeatureDiagnostic[] = [];
  if (!isObject(input)) return diagnostics;
  const inspect = (value: unknown, path: string) => {
    if (!isObject(value)) return;
    for (const key of ["physicsConstraint", "pathConstraint"]) {
      if (Object.hasOwn(value, key))
        diagnostics.push({
          code: "DB60_UNSUPPORTED_FEATURE",
          severity: "error",
          message: `DragonBones extension ${key} is recognized but not evaluated.`,
          jsonPointer: `${path}/${key}`,
          suggestedAction:
            "Preserve the original source; use an explicitly baked compatible export until this constraint is supported.",
        });
    }
  };
  inspect(input, "");
  if (Array.isArray(input["armature"]))
    input["armature"].forEach((armature: unknown, i: number) => {
      const path = `/armature/${i}`;
      inspect(armature, path);
      if (isObject(armature) && Array.isArray(armature["bone"]))
        armature["bone"].forEach((bone: unknown, j: number) =>
          inspect(bone, `${path}/bone/${j}`),
        );
    });
  return diagnostics;
}
