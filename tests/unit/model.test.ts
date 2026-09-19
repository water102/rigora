import { describe, expect, it } from "vitest";
import {
  validateSkeleton,
  serializeSkeletonSnapshot,
  parseSkeletonSnapshot,
} from "../../packages/model/src/index.js";
import { minimalSkeleton } from "../fixtures/canonical/minimal.js";

describe("canonical boundary", () => {
  it("round-trips provenance and extension data deterministically", () => {
    const input = minimalSkeleton();
    input.metadata = { z: [1, true, null], a: { second: 2, first: 1 } };
    const snapshot = serializeSkeletonSnapshot(input);
    expect(parseSkeletonSnapshot(snapshot)).toEqual(input);
    expect(serializeSkeletonSnapshot(parseSkeletonSnapshot(snapshot))).toBe(
      snapshot,
    );
    expect(snapshot.indexOf('"first"')).toBeLessThan(
      snapshot.indexOf('"second"'),
    );
  });
  it.each([
    null,
    {},
    { ...minimalSkeleton(), fps: "30" },
    { ...minimalSkeleton(), fps: Infinity },
    { ...minimalSkeleton(), unexpected: true },
  ])("rejects invalid boundary input %#", (input) => {
    expect(validateSkeleton(input).success).toBe(false);
  });
  it("rejects cyclic input without overflowing the stack", () => {
    const input: Record<string, unknown> = {};
    input["self"] = input;
    expect(validateSkeleton(input).success).toBe(false);
  });
  it("rejects unsupported snapshot versions", () => {
    expect(() =>
      parseSkeletonSnapshot(
        '{"format":"hnn-skeleton-snapshot","formatVersion":2,"skeleton":{}}',
      ),
    ).toThrow("NATIVE_INVALID_SNAPSHOT");
  });
});

describe("canonical invariants", () => {
  it("detects bone cycles and dangling references", () => {
    const input = minimalSkeleton();
    input.bones[0]!.parentId = "bone-1";
    input.slots[0]!.boneId = "absent";
    const result = validateSkeleton(input);
    expect(result.success).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "CORE_CYCLIC_BONE_HIERARCHY",
        "CORE_INVALID_REFERENCE",
      ]),
    );
  });
  it("detects IDs duplicated across entity kinds", () => {
    const input = minimalSkeleton();
    input.skins[0]!.id = "bone-1";
    expect(
      validateSkeleton(input).diagnostics.some(
        (item) => item.code === "CORE_DUPLICATE_ID",
      ),
    ).toBe(true);
  });
  it("rejects malformed geometry, weights and linked mesh cycles", () => {
    const input = minimalSkeleton();
    input.skins[0]!.attachments["slot-1"]!.push({
      type: "mesh",
      id: "mesh-1",
      name: "mesh",
      vertices: [],
      weightedVertices: [
        {
          bindPosition: { x: 0, y: 0 },
          influences: [{ boneId: "missing", weight: 0.5 }],
        },
      ],
      uvs: [],
      triangles: [0, 1, 4],
      linkedMeshId: "mesh-1",
    });
    const result = validateSkeleton(input);
    expect(result.success).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "CORE_WEIGHT_SUM_INVALID",
        "CORE_INVALID_REFERENCE",
        "CORE_INVALID_TRIANGLES",
        "CORE_INVALID_MESH",
        "CORE_CYCLIC_LINKED_MESH",
      ]),
    );
  });
  it("validates timeline target kind and time order", () => {
    const input = minimalSkeleton();
    input.animations.push({
      id: "anim-1",
      name: "walk",
      duration: 1,
      timelines: [
        {
          id: "timeline-1",
          type: "bone.rotate",
          targetId: "slot-1",
          keyframes: [
            { time: 2, value: 0, curve: { type: "linear" } },
            { time: 0, value: 1, curve: { type: "stepped" } },
          ],
        },
      ],
    });
    const result = validateSkeleton(input);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "CORE_INVALID_REFERENCE",
        "CORE_INVALID_TIME_ORDER",
      ]),
    );
  });
  it("preserves unknown behavior while reporting a warning", () => {
    const input = minimalSkeleton();
    input.skins[0]!.attachments["slot-1"]!.push({
      type: "unknownPreserved",
      id: "unknown-1",
      name: "extension",
      sourceFormat: "custom",
      payload: { untouched: [1, 2] },
    });
    const result = validateSkeleton(input);
    expect(result.success).toBe(true);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "CORE_UNSUPPORTED_BEHAVIOR",
        severity: "warning",
      }),
    ]);
    expect(parseSkeletonSnapshot(serializeSkeletonSnapshot(input))).toEqual(
      input,
    );
  });
});
