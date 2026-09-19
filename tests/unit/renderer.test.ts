import { expect, it } from "vitest";
import { TextureSource } from "pixi.js";
import {
  createAtlasTexture,
  PixiRegionRenderer,
  regionScreenMatrix,
} from "../../packages/renderer-pixi/src/index.js";
import {
  createSetupSnapshot,
  type RenderSnapshot,
} from "../../packages/runtime/src/index.js";
import { importSpine38 } from "../../packages/format-spine-38/src/index.js";
import fixture from "../fixtures/imports/spine38-region.json";
const pose = (): RenderSnapshot => {
  const imported = importSpine38(JSON.stringify(fixture), {
    namespace: "test",
  });
  if (!imported.success) throw new Error("Fixture failed");
  const result = createSetupSnapshot(imported.skeletons[0]!);
  if (!result.success) throw new Error(JSON.stringify(result.diagnostics));
  return result.snapshot;
};
it("builds a format-neutral region snapshot without modifying authored data", () => {
  const snapshot = pose();
  expect(snapshot.regions).toHaveLength(1);
  expect(snapshot.bones[1]!.origin.y).toBeCloseTo(10);
  expect(snapshot).not.toHaveProperty("source");
  const m = regionScreenMatrix(snapshot.regions[0]!, 20, 10);
  expect(m.b).toBeCloseTo(-1);
  expect(m.c).toBeCloseTo(1);
  expect(m.ty).toBeCloseTo(-10);
});
it("maps trimmed and rotated atlas regions and rejects out-of-page frames", () => {
  const source = new TextureSource({ width: 100, height: 100 });
  const texture = createAtlasTexture(source, {
    frame: { x: 4, y: 5, width: 10, height: 20 },
    original: { width: 30, height: 20 },
    trim: { x: 2, y: 3, width: 20, height: 10 },
    rotation: 90,
  });
  expect(texture.rotate).toBe(2);
  expect(texture.orig.width).toBe(30);
  expect(texture.trim!.x).toBe(2);
  expect(() =>
    createAtlasTexture(source, {
      frame: { x: 95, y: 0, width: 10, height: 10 },
      original: { width: 10, height: 10 },
    }),
  ).toThrow("ATLAS_INVALID_REGION");
  expect(() =>
    createAtlasTexture(source, {
      frame: { x: 0, y: 0, width: 10, height: 10 },
      original: { width: 20, height: 10 },
    }),
  ).toThrow("ATLAS_INVALID_TRIM");
  texture.destroy();
  source.destroy();
});
it("reuses sprites, follows explicit order, clears inactive slots and does not own textures", () => {
  const snapshot = pose();
  const source = new TextureSource({ width: 20, height: 10 });
  const texture = createAtlasTexture(source, {
    frame: { x: 0, y: 0, width: 20, height: 10 },
    original: { width: 20, height: 10 },
  });
  const renderer = new PixiRegionRenderer(
    new Map([[snapshot.regions[0]!.textureId, texture]]),
  );
  const second = { ...snapshot.regions[0]!, slotId: "second" };
  snapshot.regions.push(second);
  expect(renderer.render(snapshot)).toEqual([]);
  const layer = renderer.view.children[0]!;
  const firstSprite = layer.children[0];
  snapshot.regions.reverse();
  renderer.render(snapshot, true);
  expect(layer.children[1]).toBe(firstSprite);
  expect(renderer.view.children[1]!.visible).toBe(true);
  expect(
    renderer.render({
      ...snapshot,
      regions: [{ ...second, textureId: "absent" }],
    })[0]!.code,
  ).toBe("ASSET_TEXTURE_NOT_FOUND");
  expect(layer.children).toHaveLength(2);
  renderer.render({ regions: [], bones: [] });
  expect(layer.children).toHaveLength(0);
  renderer.destroy();
  expect(texture.destroyed).toBe(false);
  texture.destroy();
  source.destroy();
});
it("blocks unsupported setup constraints and unknown selected skins", () => {
  const imported = importSpine38(JSON.stringify(fixture), {
    namespace: "test",
  });
  if (!imported.success) throw new Error("Fixture failed");
  expect(createSetupSnapshot(imported.skeletons[0]!, "absent").success).toBe(
    false,
  );
  imported.skeletons[0]!.constraints.push({
    type: "unknownPreserved",
    id: "constraint",
    name: "unknown",
    order: 0,
    sourceFormat: "custom",
    payload: {},
  });
  expect(createSetupSnapshot(imported.skeletons[0]!).success).toBe(false);
});
