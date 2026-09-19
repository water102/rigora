import { expect, it } from "vitest";
import { TextureSource } from "pixi.js";
import {
  createAtlasTexture,
  PixiRegionRenderer,
  PixiMeshRenderer,
  regionScreenMatrix,
  type MeshRenderItem,
} from "../../packages/renderer-pixi/src/index.js";
import {
  createSetupSnapshot,
  type RenderSnapshot,
} from "../../packages/runtime/src/index.js";
import { importSpine38 } from "../../packages/format-spine-38/src/index.js";
import fixture from "../fixtures/imports/spine38-region.json";
import { weightedMeshSkeleton } from "../fixtures/canonical/weighted-mesh.js";
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
  renderer.render({ regions: [], meshes: [], bones: [] });
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
it("evaluates mesh setup attachments into RenderSnapshot.meshes", () => {
  const { skeleton } = weightedMeshSkeleton();
  const result = createSetupSnapshot(skeleton);
  expect(result.success).toBe(true);
  if (!result.success) return;
  expect(result.snapshot.meshes).toHaveLength(1);
  const mesh = result.snapshot.meshes[0]!;
  expect(mesh.slotId).toBe("slot-1");
  expect(mesh.attachmentId).toBe("mesh-1");
  expect(mesh.textureId).toBe("texture-1");
  expect(Array.from(mesh.worldXY)).toEqual([0, 0, 10, 0, 0, 10]);
  expect(Array.from(mesh.triangles)).toEqual([0, 1, 2]);
});
it("renders meshes, converts to screen Y-down, reuses dynamic buffers, and clears inactive slots", () => {
  const source = new TextureSource({ width: 32, height: 32 });
  const texture = createAtlasTexture(source, {
    frame: { x: 0, y: 0, width: 32, height: 32 },
    original: { width: 32, height: 32 },
  });
  const renderer = new PixiMeshRenderer(new Map([["texture-1", texture]]));
  const item: MeshRenderItem = {
    slotId: "slot-mesh-1",
    attachmentId: "mesh-1",
    textureId: "texture-1",
    worldXY: new Float32Array([0, 0, 10, 5, 0, 20]),
    uvs: new Float32Array([0, 0, 1, 0, 0, 1]),
    triangles: new Uint32Array([0, 1, 2]),
    color: { r: 1, g: 0.5, b: 0, a: 0.9 },
    blendMode: "additive",
  };

  const diags = renderer.render([item], true);
  expect(diags).toEqual([]);

  const layer = renderer.view.children[0]!;
  expect(layer.children).toHaveLength(1);
  const meshObj = layer.children[0] as any;
  expect(meshObj.alpha).toBeCloseTo(0.9);
  expect(meshObj.blendMode).toBe("add");

  // Verify screen coordinate conversion (Y is inverted: y -> -y)
  const positions = meshObj.geometry.positions;
  expect(Array.from(positions)).toEqual([0, -0, 10, -5, 0, -20]);

  // Second frame: update coordinates in-place (dynamic buffer reuse)
  const updatedItem: MeshRenderItem = {
    ...item,
    worldXY: new Float32Array([5, 10, 15, 20, 25, 30]),
  };
  renderer.render([updatedItem]);
  expect(layer.children[0]).toBe(meshObj); // Mesh object reused
  expect(Array.from(meshObj.geometry.positions)).toEqual([
    5, -10, 15, -20, 25, -30,
  ]);

  // Diagnostics: missing texture & non-finite geometry
  expect(
    renderer.render([
      {
        ...item,
        textureId: "missing-texture",
      },
    ])[0]!.code,
  ).toBe("ASSET_TEXTURE_NOT_FOUND");

  expect(
    renderer.render([
      {
        ...item,
        worldXY: new Float32Array([0, NaN, 10, 0, 0, 10]),
      },
    ])[0]!.code,
  ).toBe("RUNTIME_NON_FINITE_GEOMETRY");

  // Inactive slot cleanup
  renderer.render([]);
  expect(layer.children).toHaveLength(0);

  // Lifecycle: destroy renderer without destroying shared texture
  renderer.destroy();
  expect(texture.destroyed).toBe(false);
  texture.destroy();
  source.destroy();
});
