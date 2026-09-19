import { strToU8, unzipSync, zipSync } from "fflate";
import {
  parseSkeletonSnapshot,
  serializeSkeletonSnapshot,
  type SkeletonData,
} from "@rigora/model";

export interface HboneManifest {
  format: "hnn-bones";
  formatVersion: 1;
  generator: string;
  createdAt: string;
  modifiedAt: string;
  skeletons: string[];
  assets: string[];
  checksums: Record<string, string>;
}
export interface HboneProject {
  manifest: HboneManifest;
  skeletons: Record<string, SkeletonData>;
  editorState?: unknown;
}

const text = (value: unknown) =>
  JSON.stringify(value, Object.keys(value as object).sort(), 2) + "\n";
export function createProject(
  skeletons: Record<string, SkeletonData>,
  now = new Date().toISOString(),
): HboneProject {
  const ids = Object.keys(skeletons).sort();
  return {
    manifest: {
      format: "hnn-bones",
      formatVersion: 1,
      generator: "Rigora",
      createdAt: now,
      modifiedAt: now,
      skeletons: ids,
      assets: [],
      checksums: {},
    },
    skeletons: Object.fromEntries(ids.map((id) => [id, skeletons[id]!])),
  };
}
export function serializeProject(project: HboneProject): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "manifest.json": strToU8(text(project.manifest)),
  };
  for (const id of project.manifest.skeletons)
    files[`skeletons/${id}.json`] = strToU8(
      serializeSkeletonSnapshot(project.skeletons[id]),
    );
  if (project.editorState !== undefined)
    files["editor/state.json"] = strToU8(text(project.editorState));
  return zipSync(files, { level: 6 });
}
export function parseProject(bytes: Uint8Array): HboneProject {
  const files = unzipSync(bytes);
  const manifest = JSON.parse(
    new TextDecoder().decode(files["manifest.json"]!),
  ) as HboneManifest;
  if (manifest.format !== "hnn-bones" || manifest.formatVersion !== 1)
    throw new Error("NATIVE_INVALID_PROJECT");
  const skeletons: Record<string, SkeletonData> = {};
  for (const id of manifest.skeletons)
    skeletons[id] = parseSkeletonSnapshot(
      new TextDecoder().decode(files[`skeletons/${id}.json`]!),
    );
  const editor = files["editor/state.json"];
  return {
    manifest,
    skeletons,
    ...(editor
      ? { editorState: JSON.parse(new TextDecoder().decode(editor)) }
      : {}),
  };
}
