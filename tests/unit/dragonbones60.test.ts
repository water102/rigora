import { expect, it } from "vitest";
import {
  detectDragonBonesVersion,
  inspectDragonBonesExtensions,
  importDragonBones55,
} from "../../packages/format-dragonbones/src/index.js";
import fixture from "../fixtures/imports/dragonbones60-constraints.json";

it.each(["6.0", "6.0.001", "6.0.2"])(
  "recognizes %s without claiming support",
  (version) => {
    expect(detectDragonBonesVersion({ version })).toEqual({
      family: "6.0",
      exact: version,
    });
    const result = importDragonBones55(
      JSON.stringify({ version, armature: [] }),
      { namespace: "db60" },
    );
    expect(result.success).toBe(false);
    expect(result).not.toHaveProperty("skeletons");
    expect(
      result.diagnostics.some((d) => d.code === "DB60_UNSUPPORTED_VERSION"),
    ).toBe(true);
  },
);
it.each(["strict", "compatible", "repair"] as const)(
  "reports both constraint pointers transactionally in %s mode",
  (mode) => {
    const result = importDragonBones55(JSON.stringify(fixture), {
      namespace: "db60",
      mode,
      originalFile: "fixture.json",
    });
    expect(result.success).toBe(false);
    expect(
      result.diagnostics
        .filter((d) => d.code === "DB60_UNSUPPORTED_FEATURE")
        .map((d) => d.jsonPointer),
    ).toEqual(["/armature/0/physicsConstraint", "/armature/0/pathConstraint"]);
    expect(
      result.diagnostics.every((d) => d.sourcePath === "fixture.json"),
    ).toBe(true);
  },
);
it("recognizes extensions even in files labeled 5.5", () => {
  const result = importDragonBones55(
    JSON.stringify({ ...fixture, version: "5.5" }),
    { namespace: "db55" },
  );
  expect(result.success).toBe(false);
  expect(
    result.diagnostics.filter((d) => d.code === "DB60_UNSUPPORTED_FEATURE"),
  ).toHaveLength(2);
});
it("inspects only schema locations, not arbitrary user metadata", () => {
  const source = {
    version: "5.5",
    userData: { physicsConstraint: "note" },
    armature: [{ name: "a", bone: [{ name: "b", physicsConstraint: null }] }],
  };
  expect(
    inspectDragonBonesExtensions(source).map((d) => d.jsonPointer),
  ).toEqual(["/armature/0/bone/0/physicsConstraint"]);
});
it("rejects malformed version suffixes and preserves source input", () => {
  expect(detectDragonBonesVersion({ version: "6.0.2junk" }).code).toBe(
    "DB_VERSION_INVALID",
  );
  expect(detectDragonBonesVersion({}).code).toBe("DB_VERSION_MISSING");
  expect(detectDragonBonesVersion({ version: "7.0" }).family).toBe("unknown");
  const before = structuredClone(fixture);
  inspectDragonBonesExtensions(fixture);
  expect(fixture).toEqual(before);
});
