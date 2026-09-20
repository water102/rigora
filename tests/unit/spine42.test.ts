import { describe, expect, it } from "vitest";
import {
  importSpine42,
  spine42CapabilityMatrix,
} from "../../packages/format-spine-42/src/index.js";

describe("Spine 4.2 adapter", () => {
  it("routes 4.2 core data through an isolated adapter and preserves version", () => {
    const result = importSpine42(
      JSON.stringify({
        skeleton: { spine: "4.2.1" },
        bones: [{ name: "root" }],
      }),
      { namespace: "test" },
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(result.skeletons[0]!.source!.version).toBe("4.2.1");
  });
  it("exposes explicit capability labels", () => {
    expect(spine42CapabilityMatrix.physics).toBe("runtime-only");
  });
});
