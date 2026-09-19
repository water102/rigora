export interface SpineVersionDetection {
  family: "3.8" | "4.2" | "unknown";
  exact?: string;
  code?: string;
}
export function detectSpineVersion(input: unknown): SpineVersionDetection {
  if (!input || typeof input !== "object" || !("skeleton" in input))
    return { family: "unknown", code: "SPINE_VERSION_MISSING" };
  const skeleton = input.skeleton;
  if (!skeleton || typeof skeleton !== "object" || !("spine" in skeleton))
    return { family: "unknown", code: "SPINE_VERSION_MISSING" };
  const raw = skeleton.spine;
  if (typeof raw !== "string" || !/^\d+\.\d+(?:\.\d+)?$/.test(raw))
    return { family: "unknown", code: "SPINE_VERSION_INVALID" };
  const family = raw.split(".").slice(0, 2).join(".");
  return {
    family: family === "3.8" || family === "4.2" ? family : "unknown",
    exact: raw,
  };
}
