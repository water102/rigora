import { validateSkeleton, type SkeletonData } from "@rigora/model";
import type { Diagnostic } from "@rigora/diagnostics";
export type ObjectData = Record<string, unknown>;
export interface ImportOptions {
  namespace: string;
  mode?: "strict" | "compatible" | "repair";
  originalFile?: string;
  textures?: ReadonlyMap<string, { id: string; width: number; height: number }>;
}
export type ImportResult =
  | {
      success: true;
      skeletons: SkeletonData[];
      diagnostics: Diagnostic[];
      source: unknown;
    }
  | { success: false; diagnostics: Diagnostic[] };
export class ImportFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly jsonPointer: string,
  ) {
    super(message);
  }
}
export function fail(code: string, message: string, path: string): never {
  throw new ImportFailure(code, message, path);
}
export function object(value: unknown, path: string): ObjectData {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("CORE_SOURCE_SCHEMA", "Expected object.", path);
  return value as ObjectData;
}
export function list(value: unknown, path: string): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value))
    return fail("CORE_SOURCE_SCHEMA", "Expected array.", path);
  return value;
}
export function string(
  value: unknown,
  path: string,
  fallback?: string,
): string {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== "string" || !value)
    return fail("CORE_SOURCE_SCHEMA", "Expected nonempty string.", path);
  return value;
}
export function number(value: unknown, path: string, fallback = 0): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value))
    return fail("CORE_SOURCE_SCHEMA", "Expected finite number.", path);
  return value;
}
export const pointer = (key: string) =>
  key.replaceAll("~", "~0").replaceAll("/", "~1");
export function fields(value: ObjectData, allowed: string, path: string): void {
  const keys = new Set(allowed.split(" "));
  for (const key of Object.keys(value))
    if (!keys.has(key))
      fail(
        "CORE_UNSUPPORTED_SOURCE_FIELD",
        `Unsupported field: ${key}`,
        `${path}/${pointer(key)}`,
      );
}
export function names(
  items: ObjectData[],
  namespace: string,
  kind: string,
  path: string,
): Map<string, string> {
  const result = new Map<string, string>();
  items.forEach((item, i) => {
    const name = string(item["name"], `${path}/${i}/name`);
    if (result.has(name))
      fail(
        "CORE_DUPLICATE_SOURCE_NAME",
        `Duplicate name: ${name}`,
        `${path}/${i}/name`,
      );
    result.set(name, `${namespace}:${kind}:${i}`);
  });
  return result;
}
export function reference(
  name: unknown,
  ids: Map<string, string>,
  path: string,
): string {
  const value = string(name, path);
  return (
    ids.get(value) ??
    fail("CORE_INVALID_REFERENCE", `Unresolved name: ${value}`, path)
  );
}
export function base(
  name: string,
  namespace: string,
  format: "spine" | "dragonbones",
  version: string,
  fps: number,
  options: ImportOptions,
): SkeletonData {
  return {
    id: `${namespace}:skeleton`,
    name,
    coordinateSystem: "x-right-y-up-ccw-radians",
    fps,
    bones: [],
    slots: [],
    skins: [],
    constraints: [],
    animations: [],
    events: [],
    source: {
      format,
      version,
      importMode: options.mode ?? "strict",
      warnings: [],
      ...(options.originalFile ? { originalFile: options.originalFile } : {}),
    },
  };
}
export function transaction(
  text: string,
  options: ImportOptions,
  normalize: (source: ObjectData, diagnostics: Diagnostic[]) => SkeletonData[],
): ImportResult {
  const diagnostics: Diagnostic[] = [];
  try {
    if (!options.namespace)
      fail(
        "CORE_IMPORT_NAMESPACE_REQUIRED",
        "Provide a project-unique stable import namespace.",
        "",
      );
    if (text.length > 10_000_000)
      fail("CORE_SOURCE_LIMIT", "JSON exceeds 10 million characters.", "");
    let source: unknown;
    try {
      source = JSON.parse(text);
    } catch {
      return fail("CORE_INVALID_JSON", "Malformed JSON.", "");
    }
    const skeletons = normalize(object(source, ""), diagnostics);
    if (
      diagnostics.some(
        (item) => item.severity === "error" || item.severity === "fatal",
      )
    )
      return { success: false, diagnostics };
    for (const skeleton of skeletons) {
      const validation = validateSkeleton(skeleton);
      diagnostics.push(...validation.diagnostics);
      if (!validation.success) return { success: false, diagnostics };
      skeleton.source!.warnings = diagnostics
        .filter((d) => d.severity === "warning")
        .map((d) => d.code);
    }
    return { success: true, skeletons, diagnostics, source };
  } catch (error) {
    if (!(error instanceof ImportFailure)) throw error;
    diagnostics.push({
      code: error.code,
      severity: "error",
      message: error.message,
      jsonPointer: error.jsonPointer,
      ...(options.originalFile ? { sourcePath: options.originalFile } : {}),
    });
    return { success: false, diagnostics };
  }
}
export function texture(
  path: string,
  width: number | undefined,
  height: number | undefined,
  options: ImportOptions,
  diagnostics: Diagnostic[],
  at: string,
) {
  const asset = options.textures?.get(path);
  if (!asset)
    diagnostics.push({
      code: "ASSET_TEXTURE_NOT_FOUND",
      severity: "warning",
      message: `Unresolved texture: ${path}`,
      jsonPointer: at,
    });
  const w = width ?? asset?.width,
    h = height ?? asset?.height;
  if (w === undefined || h === undefined)
    fail(
      "ASSET_REGION_SIZE_REQUIRED",
      "Region dimensions require texture metadata.",
      at,
    );
  return {
    textureId:
      asset?.id ?? `${options.namespace}:texture:${encodeURIComponent(path)}`,
    width: w,
    height: h,
  };
}
