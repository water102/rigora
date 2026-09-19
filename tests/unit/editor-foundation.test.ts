import { describe, expect, it } from "vitest";
import {
  createProject,
  parseProject,
  serializeProject,
} from "../../packages/project/src/index.js";
import {
  CommandHistory,
  type EditorCommand,
} from "../../packages/editor-core/src/index.js";
import { ikSkeleton } from "../fixtures/canonical/ik-skeleton.js";

describe("Batch 14 native project", () => {
  it("round-trips deterministic skeleton projects", () => {
    const p = createProject({ main: ikSkeleton().skeleton });
    const decoded = parseProject(serializeProject(p));
    expect(decoded.skeletons.main!.bones.length).toBe(
      p.skeletons.main!.bones.length,
    );
    expect(decoded.manifest.skeletons).toEqual(["main"]);
  });
});
describe("Batch 15 command history", () => {
  it("executes, undoes, redoes and clears redo on branching", () => {
    const ctx = { value: 0 };
    const command = (delta: number): EditorCommand => ({
      id: `set-${delta}`,
      label: "Set",
      execute: (c) => {
        c.value = (c.value as number) + delta;
      },
      undo: (c) => {
        c.value = (c.value as number) - delta;
      },
    });
    const history = new CommandHistory(ctx);
    history.execute(command(2), undefined);
    expect(ctx.value).toBe(2);
    expect(history.undo()).toBe(true);
    expect(ctx.value).toBe(0);
    expect(history.redo()).toBe(true);
    expect(ctx.value).toBe(2);
    history.undo();
    history.execute(command(3), undefined);
    expect(history.canRedo).toBe(false);
    expect(ctx.value).toBe(3);
  });
});
