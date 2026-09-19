import { describe, expect, it } from "vitest";
import {
  computeCrc32,
  createProject,
  InMemoryProjectRepository,
  parseProject,
  ProjectLifecycle,
  serializeProject,
} from "../../packages/project/src/index.js";
import {
  Camera2D,
  CommandHistory,
  SelectionStore,
  type EditorCommand,
} from "../../packages/editor-core/src/index.js";
import { ikSkeleton } from "../fixtures/canonical/ik-skeleton.js";

describe("Batch 14 native project", () => {
  it("round-trips deterministic skeleton projects", () => {
    const p = createProject({ main: ikSkeleton().skeleton });
    const serialized = serializeProject(p);
    expect(serializeProject(p)).toEqual(serialized);
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

  it("stays dirty when editing from an undone branch", () => {
    const ctx = { value: 0 };
    const change = (delta: number): EditorCommand => ({
      id: `change-${delta}`,
      label: "Change",
      execute: (c) => (c.value = (c.value as number) + delta),
      undo: (c) => (c.value = (c.value as number) - delta),
    });
    const history = new CommandHistory(ctx);
    history.execute(change(1));
    history.markClean();
    history.execute(change(2));
    history.undo();
    history.execute(change(3));
    expect(ctx.value).toBe(4);
    expect(history.isDirty).toBe(true);
  });

  it("restores clean state when undoing a committed transaction", () => {
    const ctx = { value: 0 };
    const change = (delta: number): EditorCommand => ({
      id: `change-${delta}`,
      label: "Change",
      execute: (c) => (c.value = (c.value as number) + delta),
      undo: (c) => (c.value = (c.value as number) - delta),
    });
    const history = new CommandHistory(ctx);
    history.markClean();
    expect(history.isDirty).toBe(false);

    history.beginTransaction("Batch Edit");
    history.execute(change(10));
    history.execute(change(20));
    history.commitTransaction();
    expect(ctx.value).toBe(30);
    expect(history.isDirty).toBe(true);

    history.undo();
    expect(ctx.value).toBe(0);
    expect(history.isDirty).toBe(false);

    history.redo();
    expect(ctx.value).toBe(30);
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

describe("Batch 16 project lifecycle", () => {
  it("InMemoryProjectRepository performs defensive read, write, remove, and sorted list", async () => {
    const repo = new InMemoryProjectRepository();
    const data = new Uint8Array([1, 2, 3]);
    await repo.write("b.hbone", data);
    await repo.write("a.hbone", data);

    // Defensive copy on write
    data[0] = 99;
    const readB = await repo.read("b.hbone");
    expect(readB).toEqual(new Uint8Array([1, 2, 3]));

    // Defensive copy on read
    if (readB) readB[0] = 88;
    const readB2 = await repo.read("b.hbone");
    expect(readB2).toEqual(new Uint8Array([1, 2, 3]));

    // Sorted listing
    expect(await repo.list()).toEqual(["a.hbone", "b.hbone"]);

    // Read non-existent
    expect(await repo.read("c.hbone")).toBeUndefined();

    // Remove
    await repo.remove("a.hbone");
    expect(await repo.list()).toEqual(["b.hbone"]);
  });

  it("manages lifecycle operations: new, save, saveAs, markDirty, and open", async () => {
    const repo = new InMemoryProjectRepository();
    const lifecycle = new ProjectLifecycle(repo);

    expect(lifecycle.project).toBeNull();
    expect(lifecycle.path).toBeNull();
    expect(lifecycle.isDirty).toBe(false);

    // Cannot save or saveAs when no project is open
    await expect(() => lifecycle.save()).rejects.toThrow("PROJECT_NOT_OPEN");
    await expect(() => lifecycle.saveAs("p.hbone")).rejects.toThrow(
      "PROJECT_NOT_OPEN",
    );

    const project = createProject(
      { main: ikSkeleton().skeleton },
      "2026-01-01T00:00:00.000Z",
    );
    lifecycle.newProject(project);
    expect(lifecycle.isDirty).toBe(true);
    expect(lifecycle.path).toBeNull();

    // Cannot save without a path
    await expect(() => lifecycle.save()).rejects.toThrow(
      "PROJECT_SAVE_PATH_REQUIRED",
    );

    // saveAs sets path and saves
    await lifecycle.saveAs("hero.hbone");
    expect(lifecycle.path).toBe("hero.hbone");
    expect(lifecycle.isDirty).toBe(false);

    // markDirty and then save() uses existing path
    lifecycle.markDirty();
    expect(lifecycle.isDirty).toBe(true);
    await lifecycle.save();
    expect(lifecycle.isDirty).toBe(false);

    // Close and reopen
    lifecycle.close();
    expect(lifecycle.project).toBeNull();
    expect(lifecycle.path).toBeNull();

    const loaded = await lifecycle.open("hero.hbone");
    expect(lifecycle.project).toBe(loaded);
    expect(lifecycle.path).toBe("hero.hbone");
    expect(lifecycle.isDirty).toBe(false);
    expect(loaded.manifest.format).toBe("hnn-bones");

    // Open non-existent file
    await expect(() => lifecycle.open("missing.hbone")).rejects.toThrow(
      "PROJECT_NOT_FOUND: missing.hbone",
    );
  });

  it("guards against unsaved changes on close, newProject, and open", async () => {
    const repo = new InMemoryProjectRepository();
    const lifecycle = new ProjectLifecycle(repo);

    const p1 = createProject(
      { main: ikSkeleton().skeleton },
      "2026-01-01T00:00:00.000Z",
    );
    lifecycle.newProject(p1);
    await lifecycle.saveAs("p1.hbone");

    const p2 = createProject(
      { main: ikSkeleton().skeleton },
      "2026-01-02T00:00:00.000Z",
    );

    // Mark dirty
    lifecycle.markDirty();

    // Guard close
    expect(() => lifecycle.close()).toThrow("PROJECT_UNSAVED_CHANGES");
    // Guard newProject
    expect(() => lifecycle.newProject(p2)).toThrow("PROJECT_UNSAVED_CHANGES");
    // Guard open
    await expect(() => lifecycle.open("p1.hbone")).rejects.toThrow(
      "PROJECT_UNSAVED_CHANGES",
    );

    // Allowed when discard=true
    lifecycle.newProject(p2, true);
    expect(lifecycle.project).toBe(p2);
    expect(lifecycle.path).toBeNull();
    expect(lifecycle.isDirty).toBe(true);

    await lifecycle.saveAs("p2.hbone");
    lifecycle.markDirty();

    await lifecycle.open("p1.hbone", true);
    expect(lifecycle.path).toBe("p1.hbone");
    expect(lifecycle.isDirty).toBe(false);

    lifecycle.markDirty();
    lifecycle.close(true);
    expect(lifecycle.project).toBeNull();
    expect(lifecycle.isDirty).toBe(false);
  });
});

describe("Batch 17 selection model", () => {
  it("tracks typed selection without entering command history", () => {
    const store = new SelectionStore();
    const updates: Array<string | null> = [];
    const unsubscribe = store.subscribe((selection) =>
      updates.push(selection ? `${selection.kind}:${selection.id}` : null),
    );

    store.select({ kind: "bone", id: "root" });
    expect(store.isSelected("bone", "root")).toBe(true);
    expect(store.isSelected("slot", "root")).toBe(false);
    store.select({ kind: "animation", id: "walk" });
    expect(store.current).toEqual({ kind: "animation", id: "walk" });
    store.clear();
    expect(store.current).toBeNull();
    expect(updates).toEqual(["bone:root", "animation:walk", null]);

    unsubscribe();
    store.select({ kind: "constraint", id: "ik-arm" });
    expect(updates).toHaveLength(3);
  });

  it("deduplicates repeated selection and protects current from mutation", () => {
    const store = new SelectionStore();
    let emissions = 0;
    store.subscribe(() => emissions++);
    store.select({ kind: "bone", id: "root" });
    store.select({ kind: "bone", id: "root" });
    expect(emissions).toBe(1);
    const current = store.current!;
    current.id = "changed-outside-store";
    expect(store.current).toEqual({ kind: "bone", id: "root" });
    expect(emissions).toBe(1);
  });

  it("supports toggle and targeted deselect helpers", () => {
    const store = new SelectionStore();
    let emissions = 0;
    store.subscribe(() => emissions++);
    const bone = { kind: "bone" as const, id: "root" };
    store.toggle(bone);
    expect(store.current).toEqual(bone);
    store.toggle(bone);
    expect(store.current).toBeNull();
    store.select({ kind: "slot", id: "body" });
    store.deselect("bone", "root");
    expect(store.current).toEqual({ kind: "slot", id: "body" });
    store.deselect("slot", "body");
    expect(store.current).toBeNull();
    expect(emissions).toBe(4);
  });
});

describe("Batch 18 stage camera", () => {
  it("round-trips world and screen coordinates", () => {
    const camera = new Camera2D(800, 600);
    camera.setCenter({ x: 100, y: 50 });
    camera.setZoom(2);
    const world = { x: 130, y: 70 };
    expect(camera.screenToWorld(camera.worldToScreen(world))).toEqual(world);
  });

  it("pans and zooms around a stable screen anchor", () => {
    const camera = new Camera2D(800, 600);
    const anchor = { x: 200, y: 150 };
    const before = camera.screenToWorld(anchor);
    camera.zoomAt(2, anchor);
    expect(camera.screenToWorld(anchor)).toEqual(before);
    const centerBeforePan = camera.center;
    camera.panBy(20, -10);
    expect(camera.center).toEqual({
      x: centerBeforePan.x + 10,
      y: centerBeforePan.y - 5,
    });
  });

  it("frames bounds with padding and rejects invalid inputs", () => {
    const camera = new Camera2D(800, 600);
    camera.frameBounds({ x: 100, y: 50, width: 200, height: 100 }, 0.1);
    expect(camera.center).toEqual({ x: 200, y: 100 });
    expect(camera.worldToScreen({ x: 100, y: 50 }).x).toBeCloseTo(66.67, 1);
    expect(() => camera.setZoom(0)).toThrow("CAMERA_INVALID_ZOOM");
    expect(() => camera.setViewport(0, 600)).toThrow("CAMERA_INVALID_VIEWPORT");
  });
});
