import { Application, CanvasSource } from "pixi.js";
import { importSpine38 } from "@rigora/format-spine-38";
import { importDragonBones55 } from "@rigora/format-dragonbones";
import { createSetupSnapshot, type RenderSnapshot } from "@rigora/runtime";
import { createAtlasTexture, PixiRegionRenderer } from "@rigora/renderer-pixi";
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
  const renderer = new PixiRegionRenderer(new Map([["texture:body", texture]]));
  renderer.view.position.set(360, 260);
  renderer.view.scale.set(8);
  app.stage.addChild(renderer.view);
  let snapshot: RenderSnapshot | undefined;
  function refresh() {
    const options = {
      namespace: "preview",
      textures: new Map([
        ["body-image", { id: "texture:body", width: 20, height: 10 }],
      ]),
    };
    const result =
      select.value === "spine"
        ? importSpine38(JSON.stringify(spine), options)
        : importDragonBones55(JSON.stringify(dragon), options);
    if (!result.success) {
      status.textContent = JSON.stringify(result.diagnostics, null, 2);
      return;
    }
    const pose = createSetupSnapshot(result.skeletons[0]!);
    if (!pose.success) {
      status.textContent = JSON.stringify(pose.diagnostics, null, 2);
      return;
    }
    snapshot = pose.snapshot;
    const diagnostics = [
      ...result.diagnostics,
      ...pose.diagnostics,
      ...renderer.render(snapshot, debug.checked),
    ];
    app.render();
    status.textContent = `${select.selectedOptions[0]!.text} · ${snapshot.bones.length} bones · ${snapshot.regions.length} region\n${diagnostics.map((d) => `${d.severity}: ${d.code}`).join("\n") || "No diagnostics."}`;
    stage.dataset["ready"] = "true";
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
      renderer.destroy();
      texture.destroy();
      source.destroy();
      app.destroy(true);
    },
    { once: true },
  );
}
start().catch((error: unknown) => {
  status.textContent = error instanceof Error ? error.message : String(error);
});
