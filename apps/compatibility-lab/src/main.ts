import { Application, CanvasSource } from "pixi.js";
import * as Comlink from "comlink";
import { importSpine38 } from "@rigora/format-spine-38";
import { importDragonBones55 } from "@rigora/format-dragonbones";
import {
  createSetupSnapshot,
  createPoseSnapshot,
  type RenderSnapshot,
} from "@rigora/runtime";
import type { SkeletonData } from "@rigora/model";
import {
  createAtlasTexture,
  PixiRegionRenderer,
  PixiMeshRenderer,
} from "@rigora/renderer-pixi";
import type { MeshWorkerApi } from "./mesh-worker.js";
import {
  applyWeightBrush,
  applyBrushAtPoint,
  createAttachmentFromLibrary,
  bindVertices,
  createWeightDeltaCommand,
  createAuthoringDocument,
  parseAuthoringDocument,
  persistMesh,
  persistPath,
  serializeAuthoringDocument,
  createAuthoringMesh,
  applyVertexDrag,
  beginDrag,
  endDrag,
  lassoSelection,
  updateDrag,
  createDeformState,
  createEditablePath,
  pathTangents,
  setDeformOffset,
  updatePathPoint,
  unbindVertices,
  keyDeform,
  resetTopology,
  weightHeatmap,
} from "@rigora/authoring-mesh";
import { weightedMeshSkeleton } from "../../../tests/fixtures/canonical/weighted-mesh.js";
import { animatedMeshSkeleton } from "../../../tests/fixtures/canonical/animated-skeleton.js";
import { ikSkeleton } from "../../../tests/fixtures/canonical/ik-skeleton.js";
import { pathSkeleton } from "../../../tests/fixtures/canonical/path-skeleton.js";
import spine from "../../../tests/fixtures/imports/spine38-region.json";
import dragon from "../../../tests/fixtures/imports/dragonbones55-region.json";
import "./style.css";

const stage = document.querySelector<HTMLElement>("#stage")!;
const status = document.querySelector<HTMLElement>("#status")!;
const select = document.querySelector<HTMLSelectElement>("#source")!;
const debug = document.querySelector<HTMLInputElement>("#debug")!;
const playBtn = document.querySelector<HTMLButtonElement>("#play-btn")!;
const timeSlider = document.querySelector<HTMLInputElement>("#time-slider")!;
const timeDisplay = document.querySelector<HTMLElement>("#time-display")!;
const loopCheck = document.querySelector<HTMLInputElement>("#loop")!;
const autoPreviewBtn =
  document.querySelector<HTMLButtonElement>("#auto-preview")!;
const autoCancelBtn =
  document.querySelector<HTMLButtonElement>("#auto-cancel")!;
const autoWeightPower =
  document.querySelector<HTMLInputElement>("#auto-weight-power")!;
const autoWeightMax =
  document.querySelector<HTMLInputElement>("#auto-weight-max")!;
const autoWeightPreview = document.querySelector<HTMLButtonElement>(
  "#auto-weight-preview",
)!;
const autoThreshold =
  document.querySelector<HTMLInputElement>("#auto-threshold")!;
const brushMode = document.querySelector<HTMLSelectElement>("#brush-mode")!;
const brushStrength =
  document.querySelector<HTMLInputElement>("#brush-strength")!;
const paintDemo = document.querySelector<HTMLButtonElement>("#paint-demo")!;
const heatmapDemo = document.querySelector<HTMLButtonElement>("#heatmap-demo")!;
const topologyDemo =
  document.querySelector<HTMLButtonElement>("#topology-demo")!;
const deformDemo = document.querySelector<HTMLButtonElement>("#deform-demo")!;
const canvasMode = document.querySelector<HTMLSelectElement>("#canvas-mode")!;
const brushUndo = document.querySelector<HTMLButtonElement>("#brush-undo")!;
const brushRedo = document.querySelector<HTMLButtonElement>("#brush-redo")!;
const authoringSave =
  document.querySelector<HTMLButtonElement>("#authoring-save")!;
const authoringLoad =
  document.querySelector<HTMLButtonElement>("#authoring-load")!;
const bindingBone = document.querySelector<HTMLSelectElement>("#binding-bone")!;
const bindDemo = document.querySelector<HTMLButtonElement>("#bind-demo")!;
const unbindDemo = document.querySelector<HTMLButtonElement>("#unbind-demo")!;
const attachmentKind =
  document.querySelector<HTMLSelectElement>("#attachment-kind")!;
const createAttachment =
  document.querySelector<HTMLButtonElement>("#create-attachment")!;

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
  let currentSkeleton: SkeletonData | undefined;
  let currentAnimationName: string | undefined;
  let animationDuration = 1.0;
  let isPlaying = false;
  let currentTime = 0;
  let lastFrameTime = performance.now();
  let rafId: number | null = null;
  let autoPreviewActive = false;
  const demoWeights: Record<
    string,
    Record<string, number>
  > = Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [`v${i}`, { "bone-1": 1 }]),
  );
  const selectedBindingVertices = () => Object.keys(demoWeights).slice(0, 3);
  let demoTopology = createAuthoringMesh(
    Array.from({ length: 6 }, (_, i) => ({ x: i % 3, y: Math.floor(i / 3) })),
    [0, 1, 3, 1, 4, 3, 1, 2, 4, 2, 5, 4],
  );
  const libraryAsset = {
    id: "authoring-demo",
    name: "Authoring demo",
    textureId: "demo-texture",
    width: 3,
    height: 2,
    vertices: demoTopology.vertices
      .slice(0, 3)
      .map((vertex) => vertex.position),
    uvs: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    triangles: [0, 1, 2],
  };
  const persistAuthoring = () => {
    const document = persistMesh(createAuthoringDocument(), demoTopology);
    document.paths = persistPath(
      createAuthoringDocument(),
      demoPath.points,
      demoPath.closed,
    ).paths;
    document.deformOffsets["demo-mesh"] = [...demoDeform.offsets];
    localStorage.setItem(
      "rigora.authoring.preview",
      serializeAuthoringDocument(document),
    );
  };
  const restoreAuthoring = () => {
    const raw = localStorage.getItem("rigora.authoring.preview");
    if (!raw) return false;
    try {
      const document = parseAuthoringDocument(raw);
      if (document.meshes[0]) demoTopology = document.meshes[0];
      return true;
    } catch {
      return false;
    }
  };
  let demoDeform = createDeformState(demoTopology.vertices.length);
  let demoPath = createEditablePath([
    { x: -2, y: 0 },
    { x: 0, y: 2 },
    { x: 2, y: 0 },
  ]);
  const restoreResult = restoreAuthoring();
  if (restoreResult) {
    const raw = localStorage.getItem("rigora.authoring.preview");
    if (raw) {
      try {
        const document = parseAuthoringDocument(raw);
        if (document.paths[0])
          demoPath = createEditablePath(
            document.paths[0].points,
            document.paths[0].closed,
          );
        const offsets = document.deformOffsets["demo-mesh"];
        if (offsets?.length === demoDeform.offsets.length)
          demoDeform = { ...demoDeform, offsets: [...offsets] };
      } catch {
        // The first guarded parse already handled invalid persisted state.
      }
    }
  }
  let vertexDrag: ReturnType<typeof beginDrag> | null = null;
  let lassoPoints: Array<{ x: number; y: number }> = [];
  let brushStrokeCount = 0;
  let activeBrushDeltas: Array<{
    vertexId: string;
    boneId: string;
    before: number;
    after: number;
  }> = [];
  const brushUndoStack: ReturnType<typeof createWeightDeltaCommand>[] = [];
  const brushRedoStack: ReturnType<typeof createWeightDeltaCommand>[] = [];
  const brushVertices = () =>
    demoTopology.vertices.map((vertex) => ({
      id: vertex.id,
      position: vertex.position,
    }));
  const canvasPoint = (event: PointerEvent) => ({
    x: (event.offsetX - 360) / 8,
    y: (260 - event.offsetY) / 8,
  });
  app.canvas.addEventListener("pointerdown", (event) => {
    if (canvasMode.value === "lasso") {
      lassoPoints = [canvasPoint(event)];
      app.canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (canvasMode.value === "brush") {
      activeBrushDeltas = applyBrushAtPoint(
        demoWeights,
        brushVertices(),
        canvasPoint(event),
        "bone-2",
        { radius: 2, strength: 0.25, falloff: "smoothstep", mode: "add" },
      );
      brushStrokeCount = activeBrushDeltas.length;
      app.canvas.setPointerCapture(event.pointerId);
      status.textContent = `Brush preview · ${brushStrokeCount} sparse deltas`;
      return;
    }
    if (canvasMode.value === "deform") {
      vertexDrag = beginDrag("vertex", canvasPoint(event), "v0");
      app.canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (canvasMode.value === "path") {
      vertexDrag = beginDrag("vertex", canvasPoint(event), "path-0");
      app.canvas.setPointerCapture(event.pointerId);
      return;
    }
    vertexDrag = beginDrag("vertex", canvasPoint(event), "v0");
    app.canvas.setPointerCapture(event.pointerId);
  });
  app.canvas.addEventListener("pointermove", (event) => {
    if (canvasMode.value === "lasso" && lassoPoints.length) {
      lassoPoints.push(canvasPoint(event));
      status.textContent = `Lasso preview · ${lassoPoints.length} points`;
      return;
    }
    if (canvasMode.value === "brush" && event.buttons) {
      const moveDeltas = applyBrushAtPoint(
        demoWeights,
        brushVertices(),
        canvasPoint(event),
        "bone-2",
        { radius: 2, strength: 0.15, falloff: "smoothstep", mode: "add" },
      );
      activeBrushDeltas.push(...moveDeltas);
      brushStrokeCount += moveDeltas.length;
      status.textContent = `Brush preview · ${brushStrokeCount} sparse deltas`;
      return;
    }
    if (canvasMode.value === "deform" && vertexDrag) {
      vertexDrag = updateDrag(vertexDrag, canvasPoint(event));
      demoDeform = setDeformOffset(demoDeform, 0, vertexDrag.current);
      status.textContent = `Deform preview · offset (${vertexDrag.current.x.toFixed(2)}, ${vertexDrag.current.y.toFixed(2)})`;
      return;
    }
    if (canvasMode.value === "path" && vertexDrag) {
      vertexDrag = updateDrag(vertexDrag, canvasPoint(event));
      demoPath = updatePathPoint(demoPath, 0, vertexDrag.current);
      const tangent = pathTangents(demoPath)[0]!;
      status.textContent = `Path preview · tangent (${tangent.x.toFixed(2)}, ${tangent.y.toFixed(2)})`;
      return;
    }
    if (!vertexDrag) return;
    vertexDrag = updateDrag(vertexDrag, canvasPoint(event));
    demoTopology = applyVertexDrag(demoTopology, vertexDrag);
    status.textContent = `Vertex drag preview · v0 = (${vertexDrag.current.x.toFixed(2)}, ${vertexDrag.current.y.toFixed(2)})`;
  });
  app.canvas.addEventListener("pointerup", (event) => {
    if (canvasMode.value === "lasso" && lassoPoints.length) {
      const selected = lassoSelection(demoTopology.vertices, lassoPoints);
      lassoPoints = [];
      app.canvas.releasePointerCapture(event.pointerId);
      status.textContent = `Lasso selection · ${selected.length} vertices: ${selected.join(", ") || "none"}`;
      return;
    }
    if (canvasMode.value === "brush") {
      app.canvas.releasePointerCapture(event.pointerId);
      if (activeBrushDeltas.length)
        brushUndoStack.push(
          createWeightDeltaCommand(
            demoWeights,
            activeBrushDeltas,
            "Canvas brush stroke",
          ),
        );
      brushRedoStack.length = 0;
      status.textContent = `Brush stroke committed · ${brushStrokeCount} sparse deltas`;
      brushStrokeCount = 0;
      activeBrushDeltas = [];
      return;
    }
    if (canvasMode.value === "deform" && vertexDrag) {
      vertexDrag = endDrag(vertexDrag);
      persistAuthoring();
      app.canvas.releasePointerCapture(event.pointerId);
      status.textContent = `Deform committed · offset (${vertexDrag.current.x.toFixed(2)}, ${vertexDrag.current.y.toFixed(2)})`;
      vertexDrag = null;
      return;
    }
    if (canvasMode.value === "path" && vertexDrag) {
      vertexDrag = endDrag(vertexDrag);
      persistAuthoring();
      app.canvas.releasePointerCapture(event.pointerId);
      status.textContent = "Path control point committed.";
      vertexDrag = null;
      return;
    }
    if (!vertexDrag) return;
    vertexDrag = endDrag(vertexDrag);
    persistAuthoring();
    app.canvas.releasePointerCapture(event.pointerId);
    status.textContent = `Vertex drag committed · v0 = (${vertexDrag.current.x.toFixed(2)}, ${vertexDrag.current.y.toFixed(2)})`;
    vertexDrag = null;
  });
  app.canvas.addEventListener("pointercancel", () => {
    vertexDrag = null;
    lassoPoints = [];
    brushStrokeCount = 0;
    status.textContent = "Canvas gesture cancelled.";
  });
  brushUndo.addEventListener("click", () => {
    const command = brushUndoStack.pop();
    if (!command) return;
    command.undo();
    persistAuthoring();
    brushRedoStack.push(command);
    status.textContent = "Canvas brush undone.";
  });
  brushRedo.addEventListener("click", () => {
    const command = brushRedoStack.pop();
    if (!command) return;
    command.execute();
    persistAuthoring();
    brushUndoStack.push(command);
    status.textContent = "Canvas brush redone.";
  });
  authoringSave.addEventListener("click", () => {
    persistAuthoring();
    status.textContent = "Authoring state saved locally.";
  });
  authoringLoad.addEventListener("click", () => {
    status.textContent = restoreAuthoring()
      ? "Authoring state loaded."
      : "No valid authoring state found.";
  });
  bindDemo.addEventListener("click", () => {
    const deltas = bindVertices(
      demoWeights,
      selectedBindingVertices(),
      bindingBone.value,
    );
    persistAuthoring();
    status.textContent = `Bound ${deltas.length} vertices to ${bindingBone.value}.`;
  });
  unbindDemo.addEventListener("click", () => {
    const deltas = unbindVertices(
      demoWeights,
      selectedBindingVertices(),
      bindingBone.value,
    );
    persistAuthoring();
    status.textContent = `Unbound ${deltas.length} vertices from ${bindingBone.value}.`;
  });
  autoWeightPreview.addEventListener("click", async () => {
    const power = Number(autoWeightPower.value);
    const maxInfluences = Number(autoWeightMax.value);
    const bones = [
      { id: "bone-1", start: { x: 0, y: 0 }, end: { x: 0, y: 3 } },
      { id: "bone-2", start: { x: 2, y: 0 }, end: { x: 2, y: 3 } },
    ];
    try {
      const preview = await getMeshWorker().previewAutoWeights(
        demoTopology.vertices.map((vertex) => vertex.position),
        bones,
        power,
        maxInfluences,
      );
      const influenceCount = preview.reduce(
        (sum, vertex) => sum + vertex.influences.length,
        0,
      );
      status.textContent = `Auto weights preview: ${preview.length} vertices, ${influenceCount} influences (power ${power}, max ${maxInfluences}).`;
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : "Auto weights preview failed.";
    }
  });
  createAttachment.addEventListener("click", () => {
    try {
      const attachment = createAttachmentFromLibrary(
        attachmentKind.value as
          | "region"
          | "mesh"
          | "clipping"
          | "path"
          | "boundingBox",
        libraryAsset,
        { id: `demo-${attachmentKind.value}` },
      );
      status.textContent = `Created ${attachment.type} attachment ${attachment.id}.`;
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : "Attachment creation failed.";
    }
  });

  let currentImportDiagnostics: any[] = [];

  function renderPose(
    poseSnapshot: RenderSnapshot,
    extraDiagnostics: any[] = [],
  ) {
    snapshot = poseSnapshot;
    const diagnostics = [
      ...currentImportDiagnostics,
      ...extraDiagnostics,
      ...regionRenderer.render(snapshot, debug.checked),
      ...meshRenderer.render(snapshot, debug.checked),
    ];

    app.render();

    const counts: string[] = [];
    if (snapshot.regions.length)
      counts.push(`${snapshot.regions.length} region`);
    if (snapshot.meshes.length) counts.push(`${snapshot.meshes.length} mesh`);

    const animInfo = currentAnimationName
      ? ` · [${currentAnimationName} @ ${currentTime.toFixed(2)}s]`
      : "";
    status.textContent = `${select.selectedOptions[0]!.text}${animInfo} · ${snapshot.bones.length} bones · ${counts.join(", ") || "0 items"}\n${diagnostics.map((d) => `${d.severity}: ${d.code}`).join("\n") || "No diagnostics."}`;
    stage.dataset["ready"] = "true";
  }

  function evaluateCurrentTime() {
    if (!currentSkeleton) return;
    if (currentAnimationName) {
      const pose = createPoseSnapshot(currentSkeleton, {
        animationName: currentAnimationName,
        time: currentTime,
        loop: loopCheck.checked,
      });
      if (pose.success) {
        renderPose(pose.snapshot, pose.diagnostics);
      } else {
        status.textContent = JSON.stringify(pose.diagnostics, null, 2);
      }
    } else {
      const pose = createSetupSnapshot(currentSkeleton);
      if (pose.success) {
        renderPose(pose.snapshot, pose.diagnostics);
      } else {
        status.textContent = JSON.stringify(pose.diagnostics, null, 2);
      }
    }
  }

  function applySnapshot(result: {
    success: boolean;
    skeletons?: SkeletonData[];
    diagnostics: any[];
  }) {
    if (!result.success || !result.skeletons?.[0]) {
      status.textContent = JSON.stringify(result.diagnostics, null, 2);
      return;
    }
    currentSkeleton = result.skeletons[0];
    currentAnimationName = undefined;
    currentImportDiagnostics = result.diagnostics;
    evaluateCurrentTime();
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

  autoCancelBtn.addEventListener("click", () => {
    autoPreviewActive = false;
    status.textContent = "Auto-mesh preview cancelled.";
  });
  autoPreviewBtn.addEventListener("click", async () => {
    autoPreviewActive = true;
    status.textContent = "Generating alpha contour preview…";
    const pixels = new Uint8Array(image.width * image.height * 4);
    image
      .getContext("2d")!
      .getImageData(0, 0, image.width, image.height)
      .data.forEach((v, i) => {
        pixels[i] = v;
      });
    const preview = await getMeshWorker().previewAutoMesh(
      { width: image.width, height: image.height, rgba: pixels },
      { threshold: Number(autoThreshold.value), simplify: 1 },
    );
    if (autoPreviewActive)
      status.textContent = `Preview ready · ${preview.preview.contour.length} contour points · ${preview.preview.mesh.triangles.length / 3} triangles. Apply through authoring command.`;
  });
  paintDemo.addEventListener("click", () => {
    const ids = Object.keys(demoWeights).slice(0, 5);
    const deltas = applyWeightBrush(
      demoWeights,
      ids,
      "bone-2",
      brushMode.value as "add" | "subtract" | "smooth" | "erase",
      Number(brushStrength.value),
    );
    status.textContent = `Weight brush applied · ${deltas.length} sparse deltas · mode ${brushMode.value}`;
  });
  heatmapDemo.addEventListener("click", () => {
    const values = weightHeatmap(
      demoWeights,
      Object.keys(demoWeights),
      "bone-2",
    );
    status.textContent = `Heatmap preview · bone-2 contribution range ${Math.min(...values).toFixed(2)}–${Math.max(...values).toFixed(2)}`;
  });
  topologyDemo.addEventListener("click", () => {
    demoTopology = resetTopology(demoTopology);
    persistAuthoring();
    status.textContent = `Topology reset · ${demoTopology.vertices.length} stable vertices retained · 0 triangles`;
  });
  deformDemo.addEventListener("click", () => {
    let deform = createDeformState(1);
    deform = setDeformOffset(deform, 0, { x: 3, y: 1 });
    deform = keyDeform(deform, 0.5);
    status.textContent = `Deform key preview · t=0.50s · offset (${deform.offsets[0]}, ${deform.offsets[1]})`;
  });

  function refresh() {
    isPlaying = false;
    playBtn.textContent = "Play";
    currentTime = 0;
    timeSlider.value = "0";
    timeDisplay.textContent = "0.00s";

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
    } else if (select.value === "animated") {
      const fixture = animatedMeshSkeleton();
      currentSkeleton = fixture.skeleton;
      currentAnimationName = fixture.animationName;
      animationDuration = fixture.skeleton.animations[0]?.duration ?? 1.0;
      timeSlider.max = animationDuration.toString();
      currentImportDiagnostics = [];
      evaluateCurrentTime();
    } else if (select.value === "ik") {
      const fixture = ikSkeleton();
      applySnapshot({
        success: true,
        skeletons: [fixture.skeleton],
        diagnostics: [],
      });
    } else if (select.value === "path") {
      const fixture = pathSkeleton();
      applySnapshot({
        success: true,
        skeletons: [fixture.skeleton],
        diagnostics: [],
      });
    } else {
      void runWorkerAuthoring();
    }
  }

  function tick(timestamp: number) {
    const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.1);
    lastFrameTime = timestamp;

    if (isPlaying && currentAnimationName) {
      currentTime += dt;
      if (loopCheck.checked) {
        if (currentTime >= animationDuration) {
          currentTime = currentTime % animationDuration;
        }
      } else {
        if (currentTime >= animationDuration) {
          currentTime = animationDuration;
          isPlaying = false;
          playBtn.textContent = "Play";
        }
      }
      timeSlider.value = currentTime.toFixed(2);
      timeDisplay.textContent = `${currentTime.toFixed(2)}s`;
      evaluateCurrentTime();
    }

    rafId = requestAnimationFrame(tick);
  }

  playBtn.addEventListener("click", () => {
    if (!currentAnimationName) return;
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? "Pause" : "Play";
    if (isPlaying && currentTime >= animationDuration && !loopCheck.checked) {
      currentTime = 0;
      timeSlider.value = "0";
      timeDisplay.textContent = "0.00s";
    }
  });

  timeSlider.addEventListener("input", () => {
    currentTime = parseFloat(timeSlider.value);
    timeDisplay.textContent = `${currentTime.toFixed(2)}s`;
    evaluateCurrentTime();
  });

  loopCheck.addEventListener("change", () => {
    evaluateCurrentTime();
  });

  select.addEventListener("change", refresh);
  debug.addEventListener("change", () => evaluateCurrentTime());

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
  rafId = requestAnimationFrame(tick);

  window.addEventListener(
    "pagehide",
    () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
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
