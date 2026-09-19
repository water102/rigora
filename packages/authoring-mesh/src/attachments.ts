import type { Vec2 } from "@rigora/math";
import type { AttachmentData, MeshAttachment } from "@rigora/model";

export type AuthoringAttachmentKind =
  | "region"
  | "mesh"
  | "clipping"
  | "path"
  | "boundingBox";

export interface LibraryAsset {
  id: string;
  name?: string;
  textureId?: string;
  width?: number;
  height?: number;
  vertices?: readonly Vec2[];
  uvs?: readonly Vec2[];
  triangles?: readonly number[];
}

export interface AttachmentCreateOptions {
  id?: string;
  name?: string;
  closed?: boolean;
  endSlotId?: string;
}

const transform = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  shearX: 0,
  shearY: 0,
};

function points(asset: LibraryAsset): Vec2[] {
  return (asset.vertices ?? []).map((point) => ({ ...point }));
}

function identity(options: AttachmentCreateOptions, asset: LibraryAsset) {
  return {
    id: options.id ?? `${asset.id}:attachment`,
    name: options.name ?? asset.name ?? asset.id,
  };
}

/** Create a canonical attachment from a library asset without mutating it. */
export function createAttachmentFromLibrary(
  kind: AuthoringAttachmentKind,
  asset: LibraryAsset,
  options: AttachmentCreateOptions = {},
): AttachmentData {
  const base = identity(options, asset);
  if (kind === "region") {
    if (!asset.textureId) throw new Error("ATTACHMENT_TEXTURE_REQUIRED");
    if (!(asset.width !== undefined && asset.height !== undefined))
      throw new Error("ATTACHMENT_DIMENSIONS_REQUIRED");
    return {
      ...base,
      type: "region",
      textureId: asset.textureId,
      transform: { ...transform },
      width: asset.width,
      height: asset.height,
    };
  }
  if (kind === "mesh") {
    const vertices = points(asset);
    const uvs = (asset.uvs ?? vertices).map((point) => ({ ...point }));
    const triangles = [...(asset.triangles ?? [])];
    if (!vertices.length || uvs.length !== vertices.length || !triangles.length)
      throw new Error("ATTACHMENT_MESH_GEOMETRY_REQUIRED");
    const mesh: MeshAttachment = {
      ...base,
      type: "mesh",
      textureId: asset.textureId,
      vertices,
      uvs,
      triangles,
    };
    return mesh;
  }
  const vertices = points(asset);
  if (vertices.length < 2) throw new Error("ATTACHMENT_POINTS_REQUIRED");
  if (kind === "clipping")
    return {
      ...base,
      type: "clipping",
      vertices,
      endSlotId: options.endSlotId,
    };
  if (kind === "path")
    return {
      ...base,
      type: "path",
      closed: options.closed ?? false,
      constantSpeed: true,
      vertices,
    };
  return { ...base, type: "boundingBox", vertices };
}
