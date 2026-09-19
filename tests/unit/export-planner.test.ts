import { describe, expect, it } from "vitest";
import {
  createExportPlan,
  createExportReport,
  assertExportable,
  serializeSpine38,
  serializeDragonBones55,
  planDeterministicAtlas,
} from "../../packages/format-export/src/index.js";
import { minimalSkeleton } from "../fixtures/canonical/minimal.js";

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
    const first = serializeSpine38(skeleton, "3.8.75");
    expect(first).toBe(serializeSpine38(skeleton, "3.8.75"));
    expect(JSON.parse(first).skeleton.spine).toBe("3.8.75");
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
  });
});
