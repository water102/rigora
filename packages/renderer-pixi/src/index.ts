import {
  Container,
  Graphics,
  Matrix,
  Mesh,
  MeshGeometry,
  Rectangle,
  Sprite,
  Texture,
  type TextureSource,
} from "pixi.js";
import type {
  RenderSnapshot,
  RegionSnapshot,
  MeshSnapshot,
} from "@rigora/runtime";
import type { Diagnostic } from "@rigora/diagnostics";
import type { Mat2D, Rgba } from "@rigora/math";

export type { MeshSnapshot };

export interface AtlasRegion {
  frame: { x: number; y: number; width: number; height: number };
  original: { width: number; height: number };
  trim?: { x: number; y: number; width: number; height: number };
  rotation?: 0 | 90;
}
/** Atlas coordinates and trim offsets are top-left/Y-down pixels, unlike canonical math. */
export function createAtlasTexture(
  source: TextureSource,
  region: AtlasRegion,
): Texture {
  const { frame, original, trim } = region;
  const values = [
    ...Object.values(frame),
    ...Object.values(original),
    ...(trim ? Object.values(trim) : []),
  ];
  if (
    !values.every(Number.isFinite) ||
    frame.x < 0 ||
    frame.y < 0 ||
    frame.width <= 0 ||
    frame.height <= 0 ||
    original.width <= 0 ||
    original.height <= 0 ||
    frame.x + frame.width > source.width ||
    frame.y + frame.height > source.height
  )
    throw new Error("ATLAS_INVALID_REGION: invalid frame dimensions");
  if (
    region.rotation !== undefined &&
    region.rotation !== 0 &&
    region.rotation !== 90
  )
    throw new Error("ATLAS_UNSUPPORTED_ROTATION");
  const width = region.rotation === 90 ? frame.height : frame.width;
  const height = region.rotation === 90 ? frame.width : frame.height;
  if (
    trim
      ? trim.x < 0 ||
        trim.y < 0 ||
        trim.width !== width ||
        trim.height !== height ||
        trim.x + trim.width > original.width ||
        trim.y + trim.height > original.height
      : width !== original.width || height !== original.height
  )
    throw new Error("ATLAS_INVALID_TRIM");
  return new Texture({
    source,
    frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
    orig: new Rectangle(0, 0, original.width, original.height),
    ...(trim
      ? { trim: new Rectangle(trim.x, trim.y, trim.width, trim.height) }
      : {}),
    rotate: region.rotation === 90 ? 2 : 0,
  });
}

/** C * world * C, with image scale: screen and image pixels both have Y down. */
export function regionScreenMatrix(
  region: RegionSnapshot,
  textureWidth: number,
  textureHeight: number,
): Mat2D {
  if (!(textureWidth > 0 && textureHeight > 0))
    throw new Error("ATLAS_INVALID_SIZE");
  const sx = region.width / textureWidth,
    sy = region.height / textureHeight,
    m = region.world;
  return {
    a: m.a * sx,
    b: -m.b * sx,
    c: -m.c * sy,
    d: m.d * sy,
    tx: m.tx,
    ty: -m.ty,
  };
}

/** Owns display objects only. Texture sources remain owned by the caller. */
export class PixiRegionRenderer {
  readonly view = new Container();
  readonly #regions = new Container();
  readonly #debug = new Graphics();
  readonly #sprites = new Map<string, Sprite>();
  #destroyed = false;
  constructor(readonly textures: ReadonlyMap<string, Texture>) {
    this.view.addChild(this.#regions, this.#debug);
  }
  render(snapshot: RenderSnapshot, debug = false): Diagnostic[] {
    if (this.#destroyed) throw new Error("RENDERER_DESTROYED");
    const diagnostics: Diagnostic[] = [];
    const seen = new Set<string>();
    // Validate the whole submission before changing the existing display tree.
    for (const region of snapshot.regions) {
      if (seen.has(region.slotId))
        diagnostics.push({
          code: "RUNTIME_DUPLICATE_SLOT",
          severity: "error",
          message: "Snapshot contains duplicate slots.",
          entityId: region.slotId,
        });
      seen.add(region.slotId);
      const texture = this.textures.get(region.textureId);
      if (!texture || texture.destroyed)
        diagnostics.push({
          code: "ASSET_TEXTURE_NOT_FOUND",
          severity: "error",
          message: `Texture unavailable: ${region.textureId}`,
          entityId: region.attachmentId,
        });
    }
    if (diagnostics.length) return diagnostics;
    for (const [id, sprite] of this.#sprites)
      if (!seen.has(id)) {
        sprite.destroy();
        this.#sprites.delete(id);
      }
    snapshot.regions.forEach((region, i) => {
      const texture = this.textures.get(region.textureId)!;
      let sprite = this.#sprites.get(region.slotId);
      if (!sprite) {
        sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        this.#sprites.set(region.slotId, sprite);
        this.#regions.addChild(sprite);
      }
      sprite.texture = texture;
      const m = regionScreenMatrix(
        region,
        texture.orig.width,
        texture.orig.height,
      );
      sprite.setFromMatrix(new Matrix(m.a, m.b, m.c, m.d, m.tx, m.ty));
      sprite.tint =
        (Math.round(region.color.r * 255) << 16) |
        (Math.round(region.color.g * 255) << 8) |
        Math.round(region.color.b * 255);
      sprite.alpha = region.color.a;
      sprite.blendMode =
        region.blendMode === "additive" ? "add" : region.blendMode;
      this.#regions.setChildIndex(sprite, i);
    });
    this.#debug.clear();
    this.#debug.visible = debug;
    if (debug)
      for (const bone of snapshot.bones) {
        this.#debug
          .moveTo(bone.origin.x, -bone.origin.y)
          .lineTo(bone.tip.x, -bone.tip.y)
          .stroke({ color: 0x66e3ff, width: 1 });
        this.#debug.circle(bone.origin.x, -bone.origin.y, 1.5).fill(0xffffff);
      }
    return diagnostics;
  }
  destroy(): void {
    if (!this.#destroyed) {
      this.view.destroy({ children: true });
      this.#sprites.clear();
      this.#destroyed = true;
    }
  }
}

export interface MeshRenderItem {
  slotId: string;
  attachmentId: string;
  textureId: string;
  worldXY: Float32Array;
  uvs: Float32Array;
  triangles: Uint32Array;
  color?: Rgba;
  blendMode?: "normal" | "additive" | "multiply" | "screen";
}

interface MeshRecord {
  mesh: Mesh;
  geometry: MeshGeometry;
  positions: Float32Array;
  vertexCount: number;
  attachmentId: string;
}

/** Owns mesh display objects only. Texture sources remain owned by the caller. */
export class PixiMeshRenderer {
  readonly view = new Container();
  readonly #meshes = new Container();
  readonly #debug = new Graphics();
  readonly #instances = new Map<string, MeshRecord>();
  #destroyed = false;

  constructor(readonly textures: ReadonlyMap<string, Texture>) {
    this.view.addChild(this.#meshes, this.#debug);
  }

  render(
    input: readonly MeshRenderItem[] | RenderSnapshot,
    debug = false,
  ): Diagnostic[] {
    if (this.#destroyed) throw new Error("RENDERER_DESTROYED");
    const items: readonly MeshRenderItem[] =
      "meshes" in input ? input.meshes : input;
    const diagnostics: Diagnostic[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      if (seen.has(item.slotId)) {
        diagnostics.push({
          code: "RUNTIME_DUPLICATE_SLOT",
          severity: "error",
          message: "Snapshot contains duplicate mesh slots.",
          entityId: item.slotId,
        });
      }
      seen.add(item.slotId);
      const texture = this.textures.get(item.textureId);
      if (!texture || texture.destroyed) {
        diagnostics.push({
          code: "ASSET_TEXTURE_NOT_FOUND",
          severity: "error",
          message: `Texture unavailable: ${item.textureId}`,
          entityId: item.attachmentId,
        });
      }
      if (!item.worldXY.every(Number.isFinite)) {
        diagnostics.push({
          code: "RUNTIME_NON_FINITE_GEOMETRY",
          severity: "error",
          message: "Mesh vertices contain non-finite numbers.",
          entityId: item.attachmentId,
        });
      }
    }
    if (diagnostics.length) return diagnostics;

    // Prune removed slots
    for (const [id, record] of this.#instances) {
      if (!seen.has(id)) {
        record.mesh.destroy();
        this.#instances.delete(id);
      }
    }

    if (debug) {
      this.#debug.clear();
      this.#debug.visible = true;
    } else {
      this.#debug.clear();
      this.#debug.visible = false;
    }

    items.forEach((item, index) => {
      const texture = this.textures.get(item.textureId)!;
      const vertexCount = item.worldXY.length / 2;
      let record = this.#instances.get(item.slotId);

      // Recreate if geometry vertex count changed or attachment changed
      if (
        !record ||
        record.vertexCount !== vertexCount ||
        record.attachmentId !== item.attachmentId
      ) {
        if (record) record.mesh.destroy();

        const positions = new Float32Array(item.worldXY.length);
        for (let i = 0; i < item.worldXY.length; i += 2) {
          positions[i] = item.worldXY[i]!;
          positions[i + 1] = -item.worldXY[i + 1]!;
        }

        const geometry = new MeshGeometry({
          positions,
          uvs: item.uvs,
          indices: item.triangles,
        });
        const mesh = new Mesh({ geometry, texture });
        record = {
          mesh,
          geometry,
          positions,
          vertexCount,
          attachmentId: item.attachmentId,
        };
        this.#instances.set(item.slotId, record);
        this.#meshes.addChild(mesh);
      } else {
        // Reuse dynamic vertex buffer
        record.mesh.texture = texture;
        const positions = record.positions;
        for (let i = 0; i < item.worldXY.length; i += 2) {
          positions[i] = item.worldXY[i]!;
          positions[i + 1] = -item.worldXY[i + 1]!;
        }
        record.geometry.getBuffer("aPosition").update();
      }

      if (item.color) {
        record.mesh.tint =
          (Math.round(item.color.r * 255) << 16) |
          (Math.round(item.color.g * 255) << 8) |
          Math.round(item.color.b * 255);
        record.mesh.alpha = item.color.a;
      }
      if (item.blendMode) {
        record.mesh.blendMode =
          item.blendMode === "additive" ? "add" : item.blendMode;
      }
      this.#meshes.setChildIndex(record.mesh, index);

      if (debug) {
        const p = record.positions;
        const tris = item.triangles;
        for (let t = 0; t < tris.length; t += 3) {
          const i0 = tris[t]! * 2;
          const i1 = tris[t + 1]! * 2;
          const i2 = tris[t + 2]! * 2;
          this.#debug
            .moveTo(p[i0]!, p[i0 + 1]!)
            .lineTo(p[i1]!, p[i1 + 1]!)
            .lineTo(p[i2]!, p[i2 + 1]!)
            .closePath()
            .stroke({ color: 0xffa500, width: 1, alpha: 0.8 });
        }
        for (let v = 0; v < p.length; v += 2) {
          this.#debug.circle(p[v]!, p[v + 1]!, 2).fill(0xffffff);
        }
      }
    });

    if (debug && "bones" in input) {
      for (const bone of input.bones) {
        this.#debug
          .moveTo(bone.origin.x, -bone.origin.y)
          .lineTo(bone.tip.x, -bone.tip.y)
          .stroke({ color: 0x66e3ff, width: 1 });
        this.#debug.circle(bone.origin.x, -bone.origin.y, 1.5).fill(0xffffff);
      }
    }

    return diagnostics;
  }

  destroy(): void {
    if (!this.#destroyed) {
      this.view.destroy({ children: true });
      this.#instances.clear();
      this.#destroyed = true;
    }
  }
}
