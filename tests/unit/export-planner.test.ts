import { describe, expect, it } from "vitest";
import {
  createExportPlan,
  createExportReport,
  assertExportable,
  serializeSpine38,
  serializeDragonBones55,
  planDeterministicAtlas,
  createCrossFormatReport,
} from "../../packages/format-export/src/index.js";
import { minimalSkeleton } from "../fixtures/canonical/minimal.js";
import { importSpine38 } from "../../packages/format-spine-38/src/index.js";
import { importDragonBones55 } from "../../packages/format-dragonbones/src/index.js";

describe("export planning", () => {
  it("blocks unresolved preserved semantics before bytes are written", () => {
    const skeleton = minimalSkeleton();
    skeleton.skins[0]!.attachments[skeleton.slots[0]!.id]!.push({
      type: "unknownPreserved",
      id: "unknown",
      name: "unknown",
      sourceFormat: "test",
      payload: { x: 1 },
    });
    const plan = createExportPlan(skeleton, "spine-3.8");
    expect(plan.blockers).toHaveLength(1);
    expect(() => assertExportable(plan)).toThrow("EXPORT_PLAN_UNRESOLVED");
    expect(
      createExportReport(skeleton, plan, new Set(["unknown"])).checksum,
    ).toMatch(/^[0-9a-f]{8}$/);
  });
  it("serializes a deterministic Spine profile", () => {
    const skeleton = minimalSkeleton();
    skeleton.animations = [
      {
        id: "walk-id",
        name: "walk",
        duration: 1,
        timelines: [
          {
            id: "rotate",
            type: "bone.rotate",
            targetId: "bone-1",
            keyframes: [{ time: 0, value: 0, curve: { type: "linear" } }],
          },
        ],
      },
    ];
    const first = serializeSpine38(skeleton, "3.8.75");
    expect(first).toBe(serializeSpine38(skeleton, "3.8.75"));
    expect(JSON.parse(first).skeleton.spine).toBe("3.8.75");
    expect(JSON.parse(first).animations.walk["bone.rotate"].keys[0].time).toBe(
      0,
    );
  });
  it("exports supported constraints and blocks physics without approval", () => {
    const skeleton = minimalSkeleton();
    skeleton.constraints = [
      {
        id: "ik-1",
        name: "aim",
        type: "ik",
        order: 0,
        targetBoneId: "bone-1",
        boneIds: ["bone-1"],
        mix: 1,
        bendDirection: 1,
      },
    ];
    expect(JSON.parse(serializeSpine38(skeleton)).constraints[0].type).toBe(
      "ik",
    );
    skeleton.constraints.push({
      id: "physics-1",
      name: "physics",
      type: "physics",
      order: 1,
    });
    expect(() => serializeSpine38(skeleton)).toThrow("EXPORT_PLAN_UNRESOLVED");
  });
  it("serializes DragonBones 5.5 and sorts atlas input", () => {
    const skeleton = minimalSkeleton();
    expect(JSON.parse(serializeDragonBones55(skeleton)).version).toBe("5.5");
    expect(
      planDeterministicAtlas([
        { name: "z", width: 10, height: 4 },
        { name: "a", width: 5, height: 5 },
      ]).map((x) => x.name),
    ).toEqual(["a", "z"]);
    const report = createCrossFormatReport(
      skeleton,
      "spine-3.8",
      "dragonbones-5.5",
    );
    expect(report.path).toEqual(["spine-3.8", "hnn", "dragonbones-5.5"]);
    expect(report.checksums).toHaveLength(2);
  });
  it("round-trips a region through both compatibility targets", () => {
    const skeleton = minimalSkeleton();
    const attachment = skeleton.skins[0]!.attachments["slot-1"]![0]!;
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "region",
        id: attachment.id,
        name: "hero",
        textureId: "hero.png",
        transform:
          attachment.type === "region"
            ? attachment.transform
            : {
                x: 0,
                y: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                shearX: 0,
                shearY: 0,
              },
        width: 32,
        height: 16,
      },
    ];
    const spine = importSpine38(serializeSpine38(skeleton), {
      namespace: "rt-spine",
      mode: "strict",
    });
    expect(spine.success).toBe(true);
    if (spine.success) expect(spine.skeletons[0]!.bones[0]!.name).toBe("root");
    const dragon = importDragonBones55(serializeDragonBones55(skeleton), {
      namespace: "rt-db",
      mode: "strict",
      textures: new Map([["hero", { id: "hero.png", width: 32, height: 16 }]]),
    });
    expect(dragon.success, JSON.stringify(dragon)).toBe(true);
    if (dragon.success)
      expect(dragon.skeletons[0]!.skins[0]!.attachments).toBeTruthy();
  });
});
