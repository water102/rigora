import type { Vec2 } from "@rigora/math";
import type { AuthoringMesh, EditablePath } from "./authoring.js";

export interface AuthoringDocument {
  version: 1;
  meshes: AuthoringMesh[];
  paths: EditablePath[];
  deformOffsets: Record<string, number[]>;
}
export function createAuthoringDocument(): AuthoringDocument {
  return { version: 1, meshes: [], paths: [], deformOffsets: {} };
}
export function serializeAuthoringDocument(
  document: AuthoringDocument,
): string {
  return JSON.stringify(document);
}
export function parseAuthoringDocument(serialized: string): AuthoringDocument {
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error("AUTHORING_STATE_INVALID_JSON");
  }
  if (
    !value ||
    typeof value !== "object" ||
    (value as { version?: unknown }).version !== 1
  )
    throw new Error("AUTHORING_STATE_UNSUPPORTED_VERSION");
  const doc = value as AuthoringDocument;
  if (
    !Array.isArray(doc.meshes) ||
    !Array.isArray(doc.paths) ||
    !doc.deformOffsets ||
    typeof doc.deformOffsets !== "object"
  )
    throw new Error("AUTHORING_STATE_INVALID_SHAPE");
  return structuredClone(doc);
}
export function persistMesh(
  document: AuthoringDocument,
  mesh: AuthoringMesh,
): AuthoringDocument {
  return {
    ...document,
    meshes: [
      ...document.meshes.filter((m) =>
        m.vertices.every(
          (v) => !mesh.vertices.some((next) => next.id === v.id),
        ),
      ),
      structuredClone(mesh),
    ],
  };
}
export function persistPath(
  document: AuthoringDocument,
  points: readonly Vec2[],
  closed = false,
): AuthoringDocument {
  return {
    ...document,
    paths: [
      ...document.paths,
      { points: points.map((p) => ({ ...p })), closed },
    ],
  };
}
