import { Application, CanvasSource } from "pixi.js";
import * as Comlink from "comlink";
import { importSpine38 } from "@rigora/format-spine-38";
import { importDragonBones55 } from "@rigora/format-dragonbones";
import { createSetupSnapshot, type RenderSnapshot } from "@rigora/runtime";
import {
  createAtlasTexture,
  PixiRegionRenderer,
  PixiMeshRenderer,
} from "@rigora/renderer-pixi";
import type { MeshWorkerApi } from "./mesh-worker.js";
import { weightedMeshSkeleton } from "../../../tests/fixtures/canonical/weighted-mesh.js";
import spine from "../../../tests/fixtures/imports/spine38-region.json";
import dragon from "../../../tests/fixtures/imports/dragonbones55-region.json";
import "./style.css";

const stage = document.querySelector<HTMLElement>("#stage")!;
const status = document.querySelector<HTMLElement>("#status")!;
const select = document.querySelector<HTMLSelectElement>("#source")!;
const debug = document.querySelector<HTMLInputElement>("#debug")!;

async function start() {
  const app = new Application();
  await app.init({
    width: 720,
    height: 400,
    preference: "webgl",
    background: 0x111827,
    antialias: false,
    autoStart: false,
    resolution: 1,
    preserveDrawingBuffer: true,
  });
  stage.append(app.canvas);

  const image = document.createElement("canvas");
  image.width = 20;
  image.height = 10;
  const ctx = image.getContext("2d")!;
  ctx.fillStyle = "#f4a340";
  ctx.fillRect(0, 0, 20, 10);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 5, 5);
  ctx.fillStyle = "#2dd4bf";
  ctx.fillRect(15, 5, 5, 5);

  const source = new CanvasSource({ resource: image, scaleMode: "nearest" });
  const texture = createAtlasTexture(source, {
    frame: { x: 0, y: 0, width: 20, height: 10 },
    original: { width: 20, height: 10 },
  });

  const textures = new Map([
    ["texture:body", texture],
    ["texture-1", texture],
  ]);

  const regionRenderer = new PixiRegionRenderer(textures);
  regionRenderer.view.position.set(360, 260);
  regionRenderer.view.scale.set(8);

  const meshRenderer = new PixiMeshRenderer(textures);
  meshRenderer.view.position.set(360, 260);
  meshRenderer.view.scale.set(8);

  app.stage.addChild(regionRenderer.view, meshRenderer.view);

  let worker: Worker | null = null;
  let meshWorker: Comlink.Remote<MeshWorkerApi> | null = null;
  function getMeshWorker(): Comlink.Remote<MeshWorkerApi> {
    if (!meshWorker) {
      worker = new Worker(new URL("./mesh-worker.ts", import.meta.url), {
        type: "module",
      });
      meshWorker = Comlink.wrap<MeshWorkerApi>(worker);
    }
    return meshWorker;
  }

  let snapshot: RenderSnapshot | undefined;

  function applySnapshot(result: {
    success: boolean;
    skeletons?: any[];
    diagnostics: any[];
  }) {
    if (!result.success || !result.skeletons?.[0]) {
      status.textContent = JSON.stringify(result.diagnostics, null, 2);
      return;
    }

    const pose = createSetupSnapshot(result.skeletons[0]);
    if (!pose.success) {
      status.textContent = JSON.stringify(pose.diagnostics, null, 2);
      return;
    }

    snapshot = pose.snapshot;
    const diagnostics = [
      ...result.diagnostics,
      ...pose.diagnostics,
      ...regionRenderer.render(snapshot, debug.checked),
      ...meshRenderer.render(snapshot, debug.checked),
    ];

    app.render();

    const counts: string[] = [];
    if (snapshot.regions.length)
      counts.push(`${snapshot.regions.length} region`);
    if (snapshot.meshes.length) counts.push(`${snapshot.meshes.length} mesh`);

    status.textContent = `${select.selectedOptions[0]!.text} · ${snapshot.bones.length} bones · ${counts.join(", ") || "0 items"}\n${diagnostics.map((d) => `${d.severity}: ${d.code}`).join("\n") || "No diagnostics."}`;
    stage.dataset["ready"] = "true";
  }

  async function runWorkerAuthoring() {
    status.textContent = "Running auto-mesh & weights in worker…";
    const workerApi = getMeshWorker();
    const generated = await workerApi.generateGridMeshAndWeights(
      20,
      10,
      4,
      2,
      [
        { id: "bone-1", start: { x: -10, y: 0 }, end: { x: 0, y: 0 } },
        { id: "bone-2", start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
      ],
      2,
    );
    const fixture = weightedMeshSkeleton();
    const meshAttachment = fixture.skeleton.skins[0]!.attachments[
      "slot-1"
    ]![0]! as any;
    meshAttachment.vertices = [];
    meshAttachment.uvs = generated.uvs;
    meshAttachment.triangles = generated.triangles;
    meshAttachment.weightedVertices = generated.weightedVertices;
    meshAttachment.hullLength = generated.vertices.length;
    applySnapshot({
      success: true,
      skeletons: [fixture.skeleton],
      diagnostics: [],
    });
  }

  function refresh() {
    const options = {
      namespace: "preview",
      textures: new Map([
        ["body-image", { id: "texture:body", width: 20, height: 10 }],
      ]),
    };

    if (select.value === "spine") {
      applySnapshot(importSpine38(JSON.stringify(spine), options));
    } else if (select.value === "dragonbones") {
      applySnapshot(importDragonBones55(JSON.stringify(dragon), options));
    } else if (select.value === "mesh") {
      const fixture = weightedMeshSkeleton();
      applySnapshot({
        success: true,
        skeletons: [fixture.skeleton],
        diagnostics: [],
      });
    } else {
      void runWorkerAuthoring();
    }
  }

  select.addEventListener("change", refresh);
  debug.addEventListener("change", refresh);

  document
    .querySelector<HTMLButtonElement>("#snapshot")!
    .addEventListener("click", () => {
      if (!snapshot) return;
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(snapshot, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "rigora-pose.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

  refresh();

  window.addEventListener(
    "pagehide",
    () => {
      regionRenderer.destroy();
      meshRenderer.destroy();
      texture.destroy();
      source.destroy();
      app.destroy(true);
      if (worker) worker.terminate();
    },
    { once: true },
  );
}

start().catch((error: unknown) => {
  status.textContent = error instanceof Error ? error.message : String(error);
});
