import {
  Container,
  Graphics,
  Matrix,
  Rectangle,
  Sprite,
  Texture,
  type TextureSource,
} from "pixi.js";
import type { RenderSnapshot, RegionSnapshot } from "@rigora/runtime";
import type { Diagnostic } from "@rigora/diagnostics";
import type { Mat2D } from "@rigora/math";

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
