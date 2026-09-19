import { describe, expect, it } from "vitest";
import {
  computeCrc32,
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
    const serialized = serializeProject(p);
    const decoded = parseProject(serialized);
    expect(decoded.skeletons.main!.bones.length).toBe(
      p.skeletons.main!.bones.length,
    );
    expect(decoded.manifest.skeletons).toEqual(["main"]);
    expect(decoded.manifest.format).toBe("hnn-bones");
    expect(decoded.manifest.formatVersion).toBe(1);
  });

  it("round-trips full project with assets, editor state, provenance, extensions and checksums", () => {
    const textureBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x01, 0x02]);
    const atlasBytes = new Uint8Array([0x61, 0x74, 0x6c, 0x61, 0x73]);

    const project = createProject(
      { char1: ikSkeleton().skeleton },
      {
        assets: {
          "images/body.png": textureBytes,
          "atlases/main.atlas": atlasBytes,
        },
        editorState: { zoom: 1.5, pan: [100, 200], selectedBoneId: "root" },
        provenance: { "spine-source": "hero-spine-3.8.json" },
        extensions: { "com.example.physics": { gravity: 9.8 } },
      },
    );

    const packed = serializeProject(project);
    const decoded = parseProject(packed, { verifyChecksums: true });

    expect(decoded.skeletons.char1).toBeDefined();
    expect(decoded.assets).toBeDefined();
    expect(decoded.assets!["images/body.png"]).toEqual(textureBytes);
    expect(decoded.assets!["atlases/main.atlas"]).toEqual(atlasBytes);
    expect(decoded.editorState).toEqual({
      zoom: 1.5,
      pan: [100, 200],
      selectedBoneId: "root",
    });
    expect(decoded.provenance).toEqual({
      "spine-source": "hero-spine-3.8.json",
    });
    expect(decoded.manifest.extensions).toEqual({
      "com.example.physics": { gravity: 9.8 },
    });
    expect(decoded.manifest.checksums["assets/images/body.png"]).toBe(
      computeCrc32(textureBytes),
    );
  });

  it("handles archive errors gracefully", () => {
    // Corrupt archive
    expect(() => parseProject(new Uint8Array([1, 2, 3, 4, 5]))).toThrow(
      "NATIVE_CORRUPT_ARCHIVE",
    );
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

  it("merges continuous adjacent commands when supported", () => {
    const ctx = { slider: 0 };
    class DragSliderCommand implements EditorCommand {
      id = "drag-slider";
      label = "Drag slider";
      delta: number;
      constructor(delta: number) {
        this.delta = delta;
      }
      execute(c: Record<string, unknown>) {
        c.slider = (c.slider as number) + this.delta;
      }
      undo(c: Record<string, unknown>) {
        c.slider = (c.slider as number) - this.delta;
      }
      merge(next: EditorCommand<unknown>): boolean {
        if (next instanceof DragSliderCommand && next.id === this.id) {
          this.delta += next.delta;
          return true;
        }
        return false;
      }
    }

    const history = new CommandHistory(ctx);
    history.execute(new DragSliderCommand(1));
    history.execute(new DragSliderCommand(2));
    history.execute(new DragSliderCommand(3));

    // Due to merging, only 1 undo step exists!
    expect(ctx.slider).toBe(6);
    expect(history.history.length).toBe(1);

    expect(history.undo()).toBe(true);
    expect(ctx.slider).toBe(0);
    expect(history.canUndo).toBe(false);

    expect(history.redo()).toBe(true);
    expect(ctx.slider).toBe(6);
  });

  it("supports transactions and compound undo/redo", () => {
    const ctx = { x: 0, y: 0 };
    const moveX: EditorCommand = {
      id: "move-x",
      label: "Move X",
      execute: (c) => {
        c.x = (c.x as number) + 10;
      },
      undo: (c) => {
        c.x = (c.x as number) - 10;
      },
    };
    const moveY: EditorCommand = {
      id: "move-y",
      label: "Move Y",
      execute: (c) => {
        c.y = (c.y as number) + 20;
      },
      undo: (c) => {
        c.y = (c.y as number) - 20;
      },
    };

    const history = new CommandHistory(ctx);
    history.beginTransaction("Move Entity");
    expect(history.isInTransaction).toBe(true);
    expect(history.canUndo).toBe(false);

    history.execute(moveX);
    history.execute(moveY);
    expect(ctx.x).toBe(10);
    expect(ctx.y).toBe(20);

    expect(history.commitTransaction()).toBe(true);
    expect(history.isInTransaction).toBe(false);
    expect(history.history.length).toBe(1);
    expect(history.history[0]!.label).toBe("Move Entity");

    // Single undo undos both commands!
    expect(history.undo()).toBe(true);
    expect(ctx.x).toBe(0);
    expect(ctx.y).toBe(0);

    // Single redo redoes both commands!
    expect(history.redo()).toBe(true);
    expect(ctx.x).toBe(10);
    expect(ctx.y).toBe(20);
  });

  it("rolls back transactions cleanly on abort", () => {
    const ctx = { count: 10 };
    const addFive: EditorCommand = {
      id: "add-5",
      label: "Add 5",
      execute: (c) => {
        c.count = (c.count as number) + 5;
      },
      undo: (c) => {
        c.count = (c.count as number) - 5;
      },
    };

    const history = new CommandHistory(ctx);
    history.beginTransaction("Aborted Action");
    history.execute(addFive);
    expect(ctx.count).toBe(15);

    expect(history.rollbackTransaction()).toBe(true);
    expect(ctx.count).toBe(10);
    expect(history.canUndo).toBe(false);
  });

  it("transact helper automatically commits or rolls back on exception", () => {
    const ctx = { v: 100 };
    const addOne: EditorCommand = {
      id: "add-1",
      label: "Add 1",
      execute: (c) => {
        c.v = (c.v as number) + 1;
      },
      undo: (c) => {
        c.v = (c.v as number) - 1;
      },
    };

    const history = new CommandHistory(ctx);
    expect(() =>
      history.transact(() => {
        history.execute(addOne);
        throw new Error("Simulated failure during drag");
      }, "Failing action"),
    ).toThrow("Simulated failure during drag");

    expect(ctx.v).toBe(100);
    expect(history.canUndo).toBe(false);
  });

  it("tracks dirty state across edits, saves, and undos", () => {
    const ctx = { name: "initial" };
    const setName = (name: string): EditorCommand => {
      let prev: string;
      return {
        id: "set-name",
        label: "Set name",
        execute: (c) => {
          prev = c.name as string;
          c.name = name;
        },
        undo: (c) => {
          c.name = prev;
        },
      };
    };

    const history = new CommandHistory(ctx);
    expect(history.isDirty).toBe(false);

    history.execute(setName("first"));
    expect(history.isDirty).toBe(true);

    history.markClean();
    expect(history.isDirty).toBe(false);

    history.execute(setName("second"));
    expect(history.isDirty).toBe(true);

    // Undo back to saved state makes it clean again!
    history.undo();
    expect(history.isDirty).toBe(false);

    // Redo makes it dirty again!
    history.redo();
    expect(history.isDirty).toBe(true);
  });

  it("enforces history limit and clear method", () => {
    const ctx = { n: 0 };
    const inc: EditorCommand = {
      id: "inc",
      label: "Inc",
      execute: (c) => {
        c.n = (c.n as number) + 1;
      },
      undo: (c) => {
        c.n = (c.n as number) - 1;
      },
    };

    const history = new CommandHistory(ctx, 3);
    history.execute(inc);
    history.execute(inc);
    history.execute(inc);
    history.execute(inc); // 4th execution, limit is 3

    expect(history.history.length).toBe(3);
    expect(history.undo()).toBe(true);
    expect(history.undo()).toBe(true);
    expect(history.undo()).toBe(true);
    expect(history.canUndo).toBe(false); // only 3 entries preserved

    history.clear();
    expect(history.history.length).toBe(0);
    expect(history.isDirty).toBe(false);
  });
});
