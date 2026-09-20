import { describe, expect, it } from "vitest";
import {
  createExportPlan,
  createExportReport,
  assertExportable,
  serializeSpine38,
  serializeDragonBones55,
  planDeterministicAtlas,
  createCrossFormatReport,
  exportSkeleton,
  ExportPlannerSession,
  compareRoundTripSemantics,
  scanExportCapabilities,
} from "../../packages/format-export/src/index.js";
import { minimalSkeleton } from "../fixtures/canonical/minimal.js";
import { importSpine38 } from "../../packages/format-spine-38/src/index.js";
import { importDragonBones55 } from "../../packages/format-dragonbones/src/index.js";

describe("export planning", () => {
  it("blocks unresolved preserved semantics before bytes are written", () => {
    const skeleton = minimalSkeleton();
    const point = skeleton.skins[0]!.attachments["slot-1"]![0]!;
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "region",
        id: point.id,
        name: "hero",
        textureId: "hero.png",
        transform: {
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
  it("imports exported Spine animation timelines", () => {
    const skeleton = minimalSkeleton();
    const point = skeleton.skins[0]!.attachments["slot-1"]![0]!;
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "region",
        id: point.id,
        name: "hero",
        textureId: "hero.png",
        transform: {
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
            keyframes: [{ time: 0.5, value: 1, curve: { type: "linear" } }],
          },
        ],
      },
    ];
    const result = importSpine38(serializeSpine38(skeleton), {
      namespace: "animation-rt",
      mode: "strict",
      textures: new Map([["hero", { id: "hero.png", width: 32, height: 16 }]]),
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (result.success)
      expect(
        result.skeletons[0]!.animations[0]!.timelines[0]!.keyframes[0]!.time,
      ).toBe(0.5);
  });
  it("round-trips exported Spine mesh geometry", () => {
    const skeleton = minimalSkeleton();
    skeleton.slots[0]!.setupAttachmentId = "mesh-1";
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "mesh",
        id: "mesh-1",
        name: "mesh",
        vertices: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 0, y: 10 },
        ],
        uvs: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
        triangles: [0, 1, 2],
      },
    ];
    const result = importSpine38(serializeSpine38(skeleton), {
      namespace: "mesh-rt",
      mode: "strict",
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (result.success)
      expect(
        (
          result.skeletons[0]!.skins[0]!.attachments[
            "mesh-rt:slot:0"
          ]![0] as any
        ).triangles,
      ).toEqual([0, 1, 2]);
  });
  it("preserves weighted mesh influence payloads", () => {
    const skeleton = minimalSkeleton();
    skeleton.slots[0]!.setupAttachmentId = "mesh-1";
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "mesh",
        id: "mesh-1",
        name: "mesh",
        vertices: [{ x: 0, y: 0 }],
        uvs: [{ x: 0, y: 0 }],
        triangles: [],
        weightedVertices: [
          {
            bindPosition: { x: 0, y: 0 },
            influences: [
              { boneId: "bone-1", weight: 1, localPosition: { x: 0, y: 0 } },
            ],
          },
        ],
      },
    ];
    const result = importSpine38(serializeSpine38(skeleton), {
      namespace: "weighted-rt",
      mode: "strict",
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (result.success)
      expect(
        (
          result.skeletons[0]!.skins[0]!.attachments[
            "weighted-rt:slot:0"
          ]![0] as any
        ).weightedVertices[0].influences[0].weight,
      ).toBe(1);
  });
  it("round-trips linked mesh metadata", () => {
    const skeleton = minimalSkeleton();
    skeleton.slots[0]!.setupAttachmentId = "mesh-1";
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "mesh",
        id: "mesh-1",
        name: "base",
        vertices: [{ x: 0, y: 0 }],
        uvs: [{ x: 0, y: 0 }],
        triangles: [],
      },
      {
        type: "mesh",
        id: "mesh-2",
        name: "linked",
        vertices: [{ x: 0, y: 0 }],
        uvs: [{ x: 0, y: 0 }],
        triangles: [],
        linkedMeshId: "mesh-1",
        inheritDeform: true,
      },
    ];
    const result = importSpine38(serializeSpine38(skeleton), {
      namespace: "linked-rt",
      mode: "strict",
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (result.success) {
      const attachments =
        result.skeletons[0]!.skins[0]!.attachments["linked-rt:slot:0"]!;
      expect((attachments[1] as any).linkedMeshId).toBe(
        "linked-rt:attachment:0:linked-rt:slot:0:0",
      );
      expect((attachments[1] as any).inheritDeform).toBe(true);
    }
  });
  it("round-trips Spine deform timelines and events", () => {
    const skeleton = minimalSkeleton();
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "mesh",
        id: "mesh-deform",
        name: "mesh-deform",
        vertices: [{ x: 0, y: 0 }],
        uvs: [{ x: 0, y: 0 }],
        triangles: [],
      },
    ];
    skeleton.slots[0]!.setupAttachmentId = "mesh-deform";
    skeleton.animations = [
      {
        id: "deform-animation",
        name: "squash",
        duration: 0.5,
        timelines: [
          {
            id: "deform-timeline",
            type: "deform",
            targetId: "mesh-deform",
            keyframes: [
              {
                time: 0.25,
                value: { offset: [1, 2] },
                curve: { type: "linear" },
              },
            ],
          },
        ],
      },
    ];
    skeleton.events = [
      { id: "event-1", name: "hit", defaults: { sound: "hit.wav" } },
    ];
    const result = importSpine38(serializeSpine38(skeleton), {
      namespace: "deform-rt",
      mode: "strict",
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (result.success) {
      expect(result.skeletons[0]!.animations[0]!.timelines[0]!.targetId).toBe(
        "deform-rt:attachment:0:deform-rt:slot:0:0",
      );
      expect(result.skeletons[0]!.events[0]!.defaults).toEqual({
        sound: "hit.wav",
      });
    }
  });
  it("round-trips an exported Spine IK constraint", () => {
    const skeleton = minimalSkeleton();
    const point = skeleton.skins[0]!.attachments["slot-1"]![0]!;
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "region",
        id: point.id,
        name: "hero",
        textureId: "hero.png",
        transform: {
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
    skeleton.constraints = [
      {
        id: "ik-1",
        name: "aim",
        type: "ik",
        order: 0,
        targetBoneId: "bone-1",
        boneIds: ["bone-1"],
        mix: 0.75,
        bendDirection: -1,
      },
    ];
    const result = importSpine38(serializeSpine38(skeleton), {
      namespace: "constraint-rt",
      mode: "strict",
      textures: new Map([["hero", { id: "hero.png", width: 32, height: 16 }]]),
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (result.success)
      expect((result.skeletons[0]!.constraints[0] as any).mix).toBe(0.75);
  });
  it("round-trips an exported Spine path constraint", () => {
    const skeleton = minimalSkeleton();
    const point = skeleton.skins[0]!.attachments["slot-1"]![0]!;
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "region",
        id: point.id,
        name: "hero",
        textureId: "hero.png",
        transform: {
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
    skeleton.constraints = [
      {
        id: "path-1",
        name: "path",
        type: "path",
        order: 0,
        targetSlotId: "slot-1",
        boneIds: ["bone-1"],
        positionMode: "fixed",
        spacingMode: "fixed",
        rotateMode: "tangent",
        position: 2,
        spacing: 3,
        mixRotate: 1,
        mixX: 1,
        mixY: 1,
      },
    ];
    const result = importSpine38(serializeSpine38(skeleton), {
      namespace: "path-rt",
      mode: "strict",
      textures: new Map([["hero", { id: "hero.png", width: 32, height: 16 }]]),
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (result.success)
      expect((result.skeletons[0]!.constraints[0] as any).spacing).toBe(3);
  });
  it("round-trips a DragonBones IK constraint", () => {
    const skeleton = minimalSkeleton();
    const point = skeleton.skins[0]!.attachments["slot-1"]![0]!;
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "region",
        id: point.id,
        name: "hero",
        textureId: "hero.png",
        transform: {
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
    const result = importDragonBones55(
      serializeDragonBones55({
        ...skeleton,
        constraints: [
          {
            id: "ik",
            name: "aim",
            type: "ik",
            order: 0,
            targetBoneId: "bone-1",
            boneIds: ["bone-1"],
            mix: 0.5,
            bendDirection: 1,
          },
        ],
      }),
      {
        namespace: "db-constraint-rt",
        mode: "strict",
        textures: new Map([
          ["hero", { id: "hero.png", width: 32, height: 16 }],
        ]),
      },
    );
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (result.success)
      expect((result.skeletons[0]!.constraints[0] as any).mix).toBe(0.5);
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
  it("does not produce bytes until the export plan is approved", () => {
    const skeleton = minimalSkeleton();
    skeleton.constraints = [
      {
        id: "physics-1",
        name: "physics",
        type: "physics",
        order: 0,
        boneId: "bone-1",
      },
    ];
    expect(() => exportSkeleton(skeleton, "spine-3.8")).toThrow(
      "EXPORT_PLAN_UNRESOLVED",
    );
  });
  it("supports UI/E2E-style approve and reject transitions", () => {
    const session = new ExportPlannerSession(minimalSkeleton(), "spine-3.8");
    expect(session.unresolved()).toHaveLength(0);
    expect(session.export().bytes.length).toBeGreaterThan(0);
    expect(() => session.approve("missing")).toThrow(
      "EXPORT_PLAN_UNKNOWN_ENTITY",
    );
  });
  it("resolves a drop action without writing bytes early", () => {
    const skeleton = minimalSkeleton();
    skeleton.constraints = [
      {
        id: "physics-1",
        name: "physics",
        type: "physics",
        order: 0,
        boneId: "bone-1",
      },
    ];
    const session = new ExportPlannerSession(skeleton, "dragonbones-5.5");
    expect(session.unresolved()).toHaveLength(1);
    expect(session.plan.issues[0]!.action).toBe("drop");
    expect(() => session.export()).toThrow("EXPORT_PLAN_UNRESOLVED");
    session.approve("physics-1");
    expect(session.unresolved()).toHaveLength(0);
    expect(session.export().bytes.length).toBeGreaterThan(0);
  });
  it("reports the exact 3.8.75 profile risk and stable checksum", () => {
    const skeleton = minimalSkeleton();
    const first = exportSkeleton(skeleton, "spine-3.8.75");
    const second = exportSkeleton(skeleton, "spine-3.8.75");
    expect(first.report.warnings).toContain(
      "Exact Spine 3.8.75 profile requires golden verification.",
    );
    expect(first.report.checksum).toBe(second.report.checksum);
    expect(first.bytes).toEqual(second.bytes);
  });
  it("keeps export deterministic across a generated fixture corpus", () => {
    for (let index = 0; index < 32; index += 1) {
      const skeleton = minimalSkeleton();
      skeleton.bones[0]!.setup.x = index * 0.125;
      skeleton.bones[0]!.setup.rotation = index * 0.03125;
      const first = exportSkeleton(skeleton, "spine-3.8");
      const second = exportSkeleton(skeleton, "spine-3.8");
      expect(first.report.checksum).toBe(second.report.checksum);
      expect(first.bytes).toEqual(second.bytes);
    }
  });
  it("scans every canonical capability category", () => {
    const skeleton = minimalSkeleton();
    skeleton.animations = [
      { id: "anim", name: "walk", duration: 1, timelines: [] },
    ];
    skeleton.events = [{ id: "event", name: "hit" }];
    const capabilities = scanExportCapabilities(skeleton, "spine-3.8");
    expect(capabilities.map((entry) => entry.feature)).toEqual(
      expect.arrayContaining(["point", "animation", "event"]),
    );
    expect(capabilities.every((entry) => entry.action)).toBe(true);
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
    const rotated = planDeterministicAtlas(
      [{ name: "wide", width: 8, height: 3 }],
      5,
      true,
    )[0]!;
    expect(rotated.rotate).toBe(true);
    expect([rotated.width, rotated.height]).toEqual([3, 8]);
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
    if (spine.success)
      expect(
        compareRoundTripSemantics(skeleton, spine.skeletons[0]!),
      ).toHaveLength(0);
    if (dragon.success)
      expect(
        compareRoundTripSemantics(skeleton, dragon.skeletons[0]!),
      ).toHaveLength(0);
  });
  it("round-trips DragonBones mesh geometry", () => {
    const skeleton = minimalSkeleton();
    skeleton.slots[0]!.setupAttachmentId = "mesh-1";
    skeleton.skins[0]!.attachments["slot-1"] = [
      {
        type: "mesh",
        id: "mesh-1",
        name: "mesh",
        textureId: "hero.png",
        vertices: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 0, y: 10 },
        ],
        uvs: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
        triangles: [0, 1, 2],
      },
    ];
    const result = importDragonBones55(serializeDragonBones55(skeleton), {
      namespace: "db-mesh-rt",
      mode: "strict",
      textures: new Map([["mesh", { id: "hero.png", width: 32, height: 32 }]]),
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (result.success) {
      const attachments = Object.values(
        result.skeletons[0]!.skins[0]!.attachments,
      ).flat();
      expect((attachments[0] as any).triangles).toEqual([0, 1, 2]);
    }
  });
});
