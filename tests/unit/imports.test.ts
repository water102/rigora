import { expect, it } from "vitest";
import spineFixture from "../fixtures/imports/spine38-region.json";
import dragonFixture from "../fixtures/imports/dragonbones55-region.json";
import { importSpine38 } from "../../packages/format-spine-38/src/index.js";
import { importSpine42 } from "../../packages/format-spine-42/src/index.js";
import { importDragonBones55 } from "../../packages/format-dragonbones/src/index.js";
import { detectSpineVersion } from "../../packages/format-spine-common/src/index.js";
import {
  compileTransformHierarchy,
  evaluateTransformHierarchy,
} from "../../packages/math/src/index.js";
const options = {
  namespace: "fixture",
  textures: new Map([
    ["body-image", { id: "texture:body", width: 20, height: 10 }],
  ]),
};
it("normalizes both formats into the same numeric setup pose", () => {
  for (const result of [
    importSpine38(JSON.stringify(spineFixture), options),
    importDragonBones55(JSON.stringify(dragonFixture), options),
  ]) {
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(JSON.stringify(result.diagnostics));
    const data = result.skeletons[0]!;
    const world = evaluateTransformHierarchy(
      compileTransformHierarchy(data.bones),
    )[1]!;
    [world.a, world.b, world.c, world.d, world.tx, world.ty].forEach((v, i) =>
      expect(v).toBeCloseTo([0, 1, -1, 0, 0, 10][i]!, 9),
    );
    const attachment = data.skins[0]!.attachments[data.slots[0]!.id]![0]!;
    expect(attachment).toMatchObject({
      name: "actual",
      type: "region",
      textureId: "texture:body",
      width: 20,
      height: 10,
    });
    expect(data.slots[0]!.setupAttachmentId).toBe(attachment.id);
  }
});
it("always warns on exact 3.8.75 and persists stable IDs independent of display names", () => {
  const first = importSpine38(JSON.stringify(spineFixture), options);
  expect(
    first.diagnostics.some((d) => d.code === "SP38_3875_KNOWN_VERSION_RISK"),
  ).toBe(true);
  expect(first).toEqual(importSpine38(JSON.stringify(spineFixture), options));
  expect(detectSpineVersion({ skeleton: { spine: "4.2.1" } }).family).toBe(
    "4.2",
  );
  expect(detectSpineVersion({}).code).toBe("SPINE_VERSION_MISSING");
  expect(detectSpineVersion({ skeleton: { spine: "3.8.75junk" } }).code).toBe(
    "SPINE_VERSION_INVALID",
  );
});
it("accepts Spine mesh edge metadata without changing canonical geometry", () => {
  const fixture = structuredClone(spineFixture);
  const attachment = fixture.skins[0]!.attachments.body!.logical!;
  attachment.edges = [0, 1, 2, 3];
  const result = importSpine38(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
});
it("accepts Spine 4.2 sequence attachment metadata", () => {
  const fixture = structuredClone(spineFixture);
  fixture.skeleton.spine = "4.2.22";
  const attachment = fixture.skins[0]!.attachments.body!.logical!;
  attachment.sequence = { count: 2, start: 0, digits: 1, setup: 0 };
  const result = importSpine42(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  expect(
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === "CORE_UNSUPPORTED_SOURCE_FIELD",
    ),
  ).toBe(false);
});
it("maps Spine 4.2 bone inherit metadata and accepts editor icons", () => {
  const fixture = structuredClone(spineFixture);
  fixture.skeleton.spine = "4.2.22";
  fixture.bones[1]!.inherit = "noRotationOrReflection";
  fixture.bones[1]!.icon = "diamond";
  const result = importSpine42(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.bones[1]!.inherit).toBe(
      "noRotationOrReflection",
    );
});
it("maps Spine 4.2 skin bone dependencies", () => {
  const fixture = structuredClone(spineFixture);
  fixture.skeleton.spine = "4.2.22";
  fixture.skins[0]!.bones = ["root"];
  const result = importSpine42(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.skins[0]!.requiredBoneIds).toHaveLength(1);
});
it("imports Spine clipping attachments with an end slot", () => {
  const fixture = structuredClone(spineFixture);
  const attachment = fixture.skins[0]!.attachments.body!.logical!;
  Object.assign(attachment, {
    type: "clipping",
    end: "body",
    vertices: [0, 0, 20, 0, 20, 10],
    vertexCount: 3,
  });
  const result = importSpine38(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(
      Object.values(result.skeletons[0]!.skins[0]!.attachments)[0]![0],
    ).toMatchObject({
      type: "clipping",
      endSlotId: result.skeletons[0]!.slots[0]!.id,
    });
});
it("normalizes Spine 3.8 top-level IK constraints", () => {
  const fixture = structuredClone(spineFixture);
  fixture.ik = [
    { name: "leg", bones: ["tip"], target: "tip", bendPositive: false },
  ];
  const result = importSpine38(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.constraints[0]).toMatchObject({
      type: "ik",
      name: "leg",
      bendDirection: -1,
    });
});
it("normalizes Spine 3.8 top-level path constraints", () => {
  const fixture = structuredClone(spineFixture);
  fixture.path = [
    { name: "path", bones: ["tip"], target: "body", rotateMode: "chain" },
  ];
  const result = importSpine38(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.constraints[0]).toMatchObject({
      type: "path",
      name: "path",
      targetSlotId: result.skeletons[0]!.slots[0]!.id,
    });
});
it("imports Spine bounding-box attachments", () => {
  const fixture = structuredClone(spineFixture);
  const attachment = fixture.skins[0]!.attachments.body!.logical!;
  Object.assign(attachment, {
    type: "boundingbox",
    vertices: [0, 0, 20, 0, 20, 10],
    vertexCount: 3,
  });
  const result = importSpine38(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(
      Object.values(result.skeletons[0]!.skins[0]!.attachments)[0]![0],
    ).toMatchObject({
      type: "boundingBox",
    });
});
it("preserves Spine transform constraints when runtime mapping is incomplete", () => {
  const fixture = structuredClone(spineFixture);
  fixture.transform = [{ name: "aim", bones: ["tip"], target: "root", x: 5 }];
  const result = importSpine38(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  expect(
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === "SP38_TRANSFORM_CONSTRAINT_PRESERVED",
    ),
  ).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.constraints[0]).toMatchObject({
      type: "unknownPreserved",
      sourceFormat: "spine-3.8-transform",
    });
});
it("maps Spine bone inheritance modes to canonical values", () => {
  const fixture = structuredClone(spineFixture);
  fixture.bones[1]!.transform = "onlyTranslation";
  const result = importSpine38(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.bones[1]!.inherit).toBe("onlyTranslation");
});
it("preserves Spine weighted path attachments until decoding is supported", () => {
  const fixture = structuredClone(spineFixture);
  const attachment = fixture.skins[0]!.attachments.body!.logical!;
  Object.assign(attachment, {
    type: "path",
    lengths: [10],
    vertices: [1, 0, 0, 1],
    vertexCount: 1,
  });
  const result = importSpine38(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  expect(
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === "SP38_PATH_ATTACHMENT_PRESERVED",
    ),
  ).toBe(true);
});
it("preserves Spine skin-required bone metadata as a canonical tag", () => {
  const fixture = structuredClone(spineFixture);
  fixture.bones[1]!.skin = true;
  const result = importSpine38(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.bones[1]!.tags).toEqual(["skin"]);
});
it("rejects malformed JSON, foreign versions, missing parents and duplicate names transactionally", () => {
  expect(importSpine38("{", options).success).toBe(false);
  expect(
    importSpine38(
      JSON.stringify({ ...spineFixture, skeleton: { spine: "4.2.1" } }),
      options,
    ).success,
  ).toBe(false);
  const fixture = structuredClone(spineFixture);
  fixture.bones[1]!.parent = "absent";
  const missing = importSpine38(JSON.stringify(fixture), options);
  expect(missing.success).toBe(false);
  expect(missing).not.toHaveProperty("skeletons");
  fixture.bones[1]!.name = "root";
  expect(
    importSpine38(JSON.stringify(fixture), options).diagnostics.some(
      (d) => d.code === "CORE_DUPLICATE_SOURCE_NAME",
    ),
  ).toBe(true);
});
it("does not silently drop unsupported behaviors in compatible or repair mode", () => {
  for (const mode of ["compatible", "repair"] as const) {
    const result = importSpine38(
      JSON.stringify({ ...spineFixture, animations: { walk: {} } }),
      { ...options, mode },
    );
    expect(result.success).toBe(false);
    expect(
      result.diagnostics.some(
        (d) => d.code === "CORE_UNSUPPORTED_SOURCE_FIELD",
      ),
    ).toBe(true);
  }
});
it("reports unresolved texture metadata rather than inventing image dimensions", () => {
  expect(
    importDragonBones55(JSON.stringify(dragonFixture), {
      namespace: "missing",
    }).diagnostics.some((d) => d.code === "ASSET_REGION_SIZE_REQUIRED"),
  ).toBe(true);
  const result = importSpine38(JSON.stringify(spineFixture), {
    namespace: "missing",
  });
  expect(result.success).toBe(true);
  expect(
    result.diagnostics.some((d) => d.code === "ASSET_TEXTURE_NOT_FOUND"),
  ).toBe(true);
});
it("converts DragonBones pivot offset and rejects color offsets", () => {
  const fixture = structuredClone(dragonFixture);
  const armature = fixture.armature[0]!;
  Object.assign(armature.skin[0]!.slot[0]!.display[0]!, {
    pivot: { x: 0, y: 0 },
  });
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(
      result.skeletons[0]!.skins[0]!.attachments[
        result.skeletons[0]!.slots[0]!.id
      ]![0],
    ).toMatchObject({ transform: { x: 10, y: -5 } });
  Object.assign(armature.slot[0]!, { color: { rO: 1 } });
  expect(
    importDragonBones55(JSON.stringify(fixture), options).diagnostics.some(
      (d) => d.code === "DB55_COLOR_OFFSET_PRESERVED",
    ),
  ).toBe(true);
});
it("accepts DragonBones armature AABB preview metadata", () => {
  const fixture = structuredClone(dragonFixture);
  fixture.armature[0]!.aabb = { x: -10, y: -5, width: 20, height: 10 };
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
});
it("accepts DragonBones 5.6 exports with the 5.5-compatible schema", () => {
  const fixture = structuredClone(dragonFixture);
  fixture.version = "5.6";
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
});
it("accepts DragonBones 5.0 exports with the compatible skeletal schema", () => {
  const fixture = structuredClone(dragonFixture);
  fixture.version = "5.0";
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
});
it("accepts DragonBones mesh edge metadata", () => {
  const fixture = structuredClone(dragonFixture);
  const display = fixture.armature[0]!.skin[0]!.slot[0]!.display[0]!;
  Object.assign(display, { edges: [0, 1], userEdges: [1, 0] });
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  expect(
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === "CORE_UNSUPPORTED_SOURCE_FIELD",
    ),
  ).toBe(false);
});
it("preserves DragonBones animation payloads as raw timelines", () => {
  const fixture = structuredClone(dragonFixture);
  fixture.armature[0]!.animation = [{ name: "idle", duration: 24 }];
  fixture.armature[0]!.defaultActions = [{ gotoAndPlay: "idle" }];
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.animations[0]).toMatchObject({
      name: "idle",
      duration: 1,
      timelines: [{ type: "dragonbones.raw" }],
    });
  expect(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "DB55_DEFAULT_ACTIONS_PRESERVED_AS_METADATA",
    ),
  ).toBe(true);
});
it("maps DragonBones inheritance flags to canonical bone inheritance", () => {
  const fixture = structuredClone(dragonFixture);
  fixture.armature[0]!.bone[1]!.inheritScale = false;
  fixture.armature[0]!.bone[1]!.inheritRotation = false;
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.bones[1]!.inherit).toBe("noScaleOrReflection");
});
it("defaults an unnamed DragonBones skin to the default skin", () => {
  const fixture = structuredClone(dragonFixture);
  fixture.armature[0]!.skin[0]!.name = null;
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.skins[0]!.name).toBe("default");
});
it("accepts DragonBones display dimensions when exported", () => {
  const fixture = structuredClone(dragonFixture);
  Object.assign(fixture.armature[0]!.skin[0]!.slot[0]!.display[0]!, {
    width: 20,
    height: 10,
  });
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
});
it("accepts DragonBones isGlobal export metadata with a warning", () => {
  const fixture = structuredClone(dragonFixture);
  fixture.isGlobal = true;
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  expect(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "DB55_IS_GLOBAL_PRESERVED_AS_METADATA",
    ),
  ).toBe(true);
});
it("preserves DragonBones nested armature displays", () => {
  const fixture = structuredClone(dragonFixture);
  fixture.armature[0]!.skin[0]!.slot[0]!.display[0]!.type = "armature";
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  expect(
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === "DB55_NESTED_ARMATURE_PRESERVED",
    ),
  ).toBe(true);
});
it("isolates armature namespaces and rejects invalid display indices", () => {
  const fixture = structuredClone(dragonFixture);
  fixture.armature.push({
    ...structuredClone(fixture.armature[0]!),
    name: "second",
  });
  const result = importDragonBones55(JSON.stringify(fixture), options);
  expect(result.success).toBe(true);
  if (result.success)
    expect(result.skeletons[0]!.bones[0]!.id).not.toBe(
      result.skeletons[1]!.bones[0]!.id,
    );
  Object.assign(fixture.armature[0]!.slot[0]!, { displayIndex: 10 });
  expect(importDragonBones55(JSON.stringify(fixture), options).success).toBe(
    false,
  );
});
