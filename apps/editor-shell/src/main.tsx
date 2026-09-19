import * as React from "react";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { Application, Graphics } from "pixi.js";
import {
  Layout,
  Model,
  type TabNode,
  type IJsonModel,
  type Action,
} from "flexlayout-react";
import {
  createEditorServices,
  type EditorServices,
  EditorPreferencesStore,
  HierarchyModel,
  type HierarchyNode,
  Camera2D,
} from "@rigora/editor-core";
import {
  createAuthoringDocument,
  createWeightDeltaCommand,
  applyWeightBrush,
  createAuthoringMesh,
  parseAuthoringDocument,
  persistMesh,
  serializeAuthoringDocument,
} from "@rigora/authoring-mesh";
import {
  createProject,
  parseProject,
  serializeProject,
  ProjectLifecycle,
  InMemoryProjectRepository,
  AutosaveManager,
  AutosaveController,
  type HboneProject,
} from "@rigora/project";
import type { SkeletonData } from "@rigora/model";
import {
  AnimationAuthoringStore,
  AuthoringHistory,
  AuthoringPlayback,
  EventAuthoringTrack,
  type AutoKeyMode,
  copyKeys,
  fitGraphRange,
  type KeyClipboard,
  virtualizeRows,
} from "@rigora/animation";
import "flexlayout-react/style/dark.css";
import "./style.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const ServicesContext = React.createContext<EditorServices | null>(null);

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  override state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Rigora editor error", error, info);
  }
  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="recovery">
        <h1>Editor recovered from an error</h1>
        <p>{this.state.error.message}</p>
        <button onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </main>
    );
  }
}

function useServices() {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("EDITOR_SERVICES_UNAVAILABLE");
  return services;
}

const nodes: HierarchyNode[] = [
  { id: "root", name: "root" },
  { id: "body", name: "Body", parentId: "root" },
  { id: "hand", name: "Hand", parentId: "body" },
  { id: "head", name: "Head", parentId: "root" },
];

function renderRulers(
  hCanvas: HTMLCanvasElement | null,
  vCanvas: HTMLCanvasElement | null,
  camera: Camera2D,
  width: number,
  height: number,
  step: number,
) {
  if (!hCanvas || !vCanvas) return;
  const dpr = window.devicePixelRatio || 1;
  const RULER_H_HEIGHT = 20;
  const RULER_V_WIDTH = 24;

  const targetHW = Math.max(1, Math.round(width * dpr));
  const targetHH = Math.max(1, Math.round(RULER_H_HEIGHT * dpr));
  if (hCanvas.width !== targetHW || hCanvas.height !== targetHH) {
    hCanvas.width = targetHW;
    hCanvas.height = targetHH;
  }

  const targetVW = Math.max(1, Math.round(RULER_V_WIDTH * dpr));
  const targetVH = Math.max(1, Math.round(height * dpr));
  if (vCanvas.width !== targetVW || vCanvas.height !== targetVH) {
    vCanvas.width = targetVW;
    vCanvas.height = targetVH;
  }

  const hCtx = hCanvas.getContext("2d");
  const vCtx = vCanvas.getContext("2d");
  if (!hCtx || !vCtx) return;

  // --- Horizontal Ruler ---
  hCtx.save();
  hCtx.scale(dpr, dpr);
  hCtx.fillStyle = "#202025";
  hCtx.fillRect(0, 0, width, RULER_H_HEIGHT);
  hCtx.strokeStyle = "#141417";
  hCtx.lineWidth = 1;
  hCtx.beginPath();
  hCtx.moveTo(0, RULER_H_HEIGHT - 0.5);
  hCtx.lineTo(width, RULER_H_HEIGHT - 0.5);
  hCtx.stroke();

  const minWorldX = (0 - width / 2) / camera.zoom + camera.center.x;
  const maxWorldX = (width - width / 2) / camera.zoom + camera.center.x;

  const minorStep = step / 10;
  const startMinorX = Math.floor(minWorldX / minorStep) * minorStep;
  const endMinorX = Math.ceil(maxWorldX / minorStep) * minorStep;

  hCtx.font =
    "9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  hCtx.textAlign = "center";
  hCtx.textBaseline = "top";

  for (let wx = startMinorX; wx <= endMinorX; wx += minorStep) {
    const sx =
      Math.floor((wx - camera.center.x) * camera.zoom + width / 2) + 0.5;
    if (sx < -20 || sx > width + 20) continue;

    const isMajor =
      Math.abs(Math.round(wx / step) * step - wx) < minorStep * 0.1;
    const isMedium =
      Math.abs(Math.round(wx / (step / 2)) * (step / 2) - wx) < minorStep * 0.1;

    hCtx.beginPath();
    if (isMajor) {
      hCtx.strokeStyle = "#82828e";
      hCtx.moveTo(sx, RULER_H_HEIGHT - 7);
      hCtx.lineTo(sx, RULER_H_HEIGHT);
      hCtx.stroke();

      hCtx.fillStyle = "#a8a8b5";
      hCtx.fillText(String(Math.round(wx)), sx, 2);
    } else if (isMedium) {
      hCtx.strokeStyle = "#52525c";
      hCtx.moveTo(sx, RULER_H_HEIGHT - 5);
      hCtx.lineTo(sx, RULER_H_HEIGHT);
      hCtx.stroke();
    } else {
      hCtx.strokeStyle = "#383842";
      hCtx.moveTo(sx, RULER_H_HEIGHT - 3);
      hCtx.lineTo(sx, RULER_H_HEIGHT);
      hCtx.stroke();
    }
  }
  hCtx.restore();

  // --- Vertical Ruler ---
  vCtx.save();
  vCtx.scale(dpr, dpr);
  vCtx.fillStyle = "#202025";
  vCtx.fillRect(0, 0, RULER_V_WIDTH, height);
  vCtx.strokeStyle = "#141417";
  vCtx.lineWidth = 1;
  vCtx.beginPath();
  vCtx.moveTo(RULER_V_WIDTH - 0.5, 0);
  vCtx.lineTo(RULER_V_WIDTH - 0.5, height);
  vCtx.stroke();

  const minWorldY = -((height - height / 2) / camera.zoom) + camera.center.y;
  const maxWorldY = -((0 - height / 2) / camera.zoom) + camera.center.y;

  const startMinorY = Math.floor(minWorldY / minorStep) * minorStep;
  const endMinorY = Math.ceil(maxWorldY / minorStep) * minorStep;

  vCtx.font =
    "9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  vCtx.textAlign = "center";
  vCtx.textBaseline = "middle";

  for (let wy = startMinorY; wy <= endMinorY; wy += minorStep) {
    const sy =
      Math.floor(-(wy - camera.center.y) * camera.zoom + height / 2) + 0.5;
    if (sy < -20 || sy > height + 20) continue;

    const isMajor =
      Math.abs(Math.round(wy / step) * step - wy) < minorStep * 0.1;
    const isMedium =
      Math.abs(Math.round(wy / (step / 2)) * (step / 2) - wy) < minorStep * 0.1;

    vCtx.beginPath();
    if (isMajor) {
      vCtx.strokeStyle = "#82828e";
      vCtx.moveTo(RULER_V_WIDTH - 7, sy);
      vCtx.lineTo(RULER_V_WIDTH, sy);
      vCtx.stroke();

      vCtx.save();
      vCtx.translate(8, sy);
      vCtx.rotate(-Math.PI / 2);
      vCtx.fillStyle = "#a8a8b5";
      vCtx.fillText(String(Math.round(wy)), 0, 0);
      vCtx.restore();
    } else if (isMedium) {
      vCtx.strokeStyle = "#52525c";
      vCtx.moveTo(RULER_V_WIDTH - 5, sy);
      vCtx.lineTo(RULER_V_WIDTH, sy);
      vCtx.stroke();
    } else {
      vCtx.strokeStyle = "#383842";
      vCtx.moveTo(RULER_V_WIDTH - 3, sy);
      vCtx.lineTo(RULER_V_WIDTH, sy);
      vCtx.stroke();
    }
  }
  vCtx.restore();
}

function Stage() {
  const services = useServices();
  const selection = services.selection.current;
  const hostRef = useRef<HTMLDivElement>(null);
  const hRulerRef = useRef<HTMLCanvasElement>(null);
  const vRulerRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera2D | null>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const [viewInfo, setViewInfo] = useState({ zoom: 100, gridStep: "100px" });
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const app = new Application();
    const camera = new Camera2D(1, 1);
    camera.setCenter({ x: 25, y: 75 });
    cameraRef.current = camera;
    const grid = new Graphics();
    const skeleton = new Graphics();
    const fallbackBones = [
      { id: "root", x: 0, y: 0, tx: 0, ty: 80 },
      { id: "body", x: 0, y: 80, tx: 55, ty: 135 },
      { id: "hand", x: 55, y: 135, tx: 105, ty: 120 },
      { id: "head", x: 0, y: 80, tx: -5, ty: 150 },
    ];

    const worldToScreen = (
      p: { x: number; y: number },
      width: number,
      height: number,
    ) => ({
      x: (p.x - camera.center.x) * camera.zoom + width / 2,
      y: -(p.y - camera.center.y) * camera.zoom + height / 2,
    });

    const screenToWorld = (
      p: { x: number; y: number },
      width: number,
      height: number,
    ) => ({
      x: (p.x - width / 2) / camera.zoom + camera.center.x,
      y: -(p.y - height / 2) / camera.zoom + camera.center.y,
    });

    const draw = () => {
      const width = host.clientWidth || 640;
      const height = host.clientHeight || 420;
      camera.setViewport(width, height);
      grid.clear();

      // Calculate visible world bounds (World: +X right, +Y up; Screen: +X right, +Y down)
      const topLeft = screenToWorld({ x: 0, y: 0 }, width, height);
      const bottomRight = screenToWorld({ x: width, y: height }, width, height);

      const bounds = {
        x: topLeft.x,
        y: bottomRight.y,
        width: Math.max(bottomRight.x - topLeft.x, 1),
        height: Math.max(topLeft.y - bottomRight.y, 1),
      };

      // Adaptive grid spacing according to zoom level
      const targetWorldStep = 100 / camera.zoom;
      const power = Math.pow(10, Math.floor(Math.log10(targetWorldStep)));
      const ratio = targetWorldStep / power;
      const step = ratio < 2 ? 1 : ratio < 5 ? 2 : 5;
      const spacing = Math.max(0.01, step * power);

      const stepText =
        spacing >= 1 ? `${Math.round(spacing)}px` : `${spacing.toFixed(1)}px`;
      setViewInfo({
        zoom: Math.round(camera.zoom * 100),
        gridStep: stepText,
      });

      // 1. Draw Alternating Checkerboard Tiles (Mẫu xám xen kẽ chuẩn LoongApp / Spine)
      const tileStartX = Math.floor(bounds.x / spacing);
      const tileEndX = Math.ceil((bounds.x + bounds.width) / spacing);
      const tileStartY = Math.floor(bounds.y / spacing);
      const tileEndY = Math.ceil((bounds.y + bounds.height) / spacing);

      const colorA = 0x3e3e46;
      const colorB = 0x35353c;

      for (let ix = tileStartX; ix < tileEndX; ix++) {
        for (let iy = tileStartY; iy < tileEndY; iy++) {
          const isA = (((ix + iy) % 2) + 2) % 2 === 0;
          const sTopLeft = worldToScreen(
            { x: ix * spacing, y: (iy + 1) * spacing },
            width,
            height,
          );
          const sBottomRight = worldToScreen(
            { x: (ix + 1) * spacing, y: iy * spacing },
            width,
            height,
          );

          const rw = Math.ceil(sBottomRight.x - sTopLeft.x) + 1;
          const rh = Math.ceil(sBottomRight.y - sTopLeft.y) + 1;

          grid
            .rect(Math.floor(sTopLeft.x), Math.floor(sTopLeft.y), rw, rh)
            .fill(isA ? colorA : colorB);
        }
      }

      // 2. Subtle grid lines on tile boundaries
      for (let ix = tileStartX; ix <= tileEndX; ix++) {
        const sx = worldToScreen({ x: ix * spacing, y: 0 }, width, height).x;
        grid
          .moveTo(Math.floor(sx) + 0.5, 0)
          .lineTo(Math.floor(sx) + 0.5, height)
          .stroke({ color: 0x2e2e34, width: 0.5 });
      }
      for (let iy = tileStartY; iy <= tileEndY; iy++) {
        const sy = worldToScreen({ x: 0, y: iy * spacing }, width, height).y;
        grid
          .moveTo(0, Math.floor(sy) + 0.5)
          .lineTo(width, Math.floor(sy) + 0.5)
          .stroke({ color: 0x2e2e34, width: 0.5 });
      }

      // 3. Origin axes (X = 0 và Y = 0)
      const originScreen = worldToScreen({ x: 0, y: 0 }, width, height);
      grid
        .moveTo(Math.floor(originScreen.x) + 0.5, 0)
        .lineTo(Math.floor(originScreen.x) + 0.5, height)
        .stroke({ color: 0x141418, width: 1.5 });
      grid
        .moveTo(0, Math.floor(originScreen.y) + 0.5)
        .lineTo(width, Math.floor(originScreen.y) + 0.5)
        .stroke({ color: 0x141418, width: 1.5 });

      // 4. Origin Gizmo (tâm toạ độ như mẫu LoongApp)
      const ox = originScreen.x;
      const oy = originScreen.y;
      grid.circle(ox, oy, 16).stroke({ color: 0x6e7681, width: 1 });
      grid.circle(ox, oy, 3.5).fill(0xffffff);
      grid
        .moveTo(ox, oy)
        .lineTo(ox + 22, oy)
        .stroke({ color: 0xf43f5e, width: 3 });
      grid.circle(ox + 22, oy, 3.5).fill(0xf43f5e);
      grid
        .moveTo(ox, oy)
        .lineTo(ox, oy - 22)
        .stroke({ color: 0x22c55e, width: 3 });
      grid.circle(ox, oy - 22, 3.5).fill(0x22c55e);
      grid
        .moveTo(ox, oy)
        .lineTo(ox - 14, oy)
        .stroke({ color: 0xec4899, width: 2.5 });
      grid
        .moveTo(ox, oy)
        .lineTo(ox, oy + 14)
        .stroke({ color: 0x10b981, width: 2.5 });

      // 5. Draw Skeleton Bones
      skeleton.clear();
      const projectBones = (
        (services.project as HboneProject).skeletons.main?.bones ?? []
      ).map((bone) => ({
        id: bone.id,
        x: bone.setup.x,
        y: bone.setup.y,
        tx: bone.setup.x,
        ty: bone.setup.y + bone.length,
      }));
      const bones = projectBones.length ? projectBones : fallbackBones;
      for (const bone of bones) {
        const a = worldToScreen({ x: bone.x, y: bone.y }, width, height);
        const b = worldToScreen({ x: bone.tx, y: bone.ty }, width, height);
        const selected =
          selectionRef.current?.kind === "bone" &&
          selectionRef.current.id === bone.id;
        skeleton
          .moveTo(a.x, a.y)
          .lineTo(b.x, b.y)
          .stroke({
            color: selected ? 0xffc857 : 0x65dccb,
            width: selected ? 5 : 3,
          });
        skeleton
          .circle(a.x, a.y, selected ? 7 : 5)
          .fill(selected ? 0xffc857 : 0x9deee2);
      }
      app.renderer.render(app.stage);

      // 6. Synchronize Canvas Rulers (Thước đo ngang và dọc)
      renderRulers(
        hRulerRef.current,
        vRulerRef.current,
        camera,
        width,
        height,
        spacing,
      );
    };

    drawRef.current = draw;

    void app
      .init({
        background: 0x35353c,
        antialias: true,
        autoStart: false,
        resizeTo: host,
      })
      .then(() => {
        if (disposed) {
          app.destroy(true);
          return;
        }
        host.appendChild(app.canvas);
        app.stage.addChild(grid, skeleton);
        draw();
      })
      .catch((error: unknown) => {
        if (!disposed) console.error("Pixi initialization failed", error);
      });

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const width = host.clientWidth || 640;
      const height = host.clientHeight || 420;
      const rect = host.getBoundingClientRect();
      const mouse = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const factor = event.deltaY < 0 ? 1.15 : 0.87;
      const beforeWorld = screenToWorld(mouse, width, height);
      camera.setZoom(camera.zoom * factor);
      const afterWorld = screenToWorld(mouse, width, height);
      camera.setCenter({
        x: camera.center.x + (beforeWorld.x - afterWorld.x),
        y: camera.center.y + (beforeWorld.y - afterWorld.y),
      });
      draw();
    };

    let dragging = false;
    let last = { x: 0, y: 0 };
    const onDown = (event: PointerEvent) => {
      if (event.button === 1 || event.button === 2) {
        dragging = true;
        last = { x: event.clientX, y: event.clientY };
        host.setPointerCapture(event.pointerId);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (dragging) {
        const dx = event.clientX - last.x;
        const dy = event.clientY - last.y;
        camera.setCenter({
          x: camera.center.x - dx / camera.zoom,
          y: camera.center.y + dy / camera.zoom,
        });
        last = { x: event.clientX, y: event.clientY };
        draw();
      }
    };
    const onUp = () => {
      dragging = false;
    };

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const width = host.clientWidth || 640;
      const height = host.clientHeight || 420;
      const rect = host.getBoundingClientRect();
      const point = screenToWorld(
        { x: event.clientX - rect.left, y: event.clientY - rect.top },
        width,
        height,
      );
      const projectBones = (
        (services.project as HboneProject).skeletons.main?.bones ?? []
      ).map((bone) => ({
        id: bone.id,
        x: bone.setup.x,
        y: bone.setup.y,
        tx: bone.setup.x,
        ty: bone.setup.y + bone.length,
      }));
      const bones = projectBones.length ? projectBones : fallbackBones;
      const hit = bones.find((bone) => {
        const px = point.x,
          py = point.y;
        const ax = bone.x,
          ay = bone.y,
          bx = bone.tx,
          by = bone.ty;
        const dx = bx - ax,
          dy = by - ay,
          length = Math.hypot(dx, dy) || 1;
        const t = Math.max(
          0,
          Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (length * length)),
        );
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) < 12;
      });
      if (hit) services.selection.select({ kind: "bone", id: hit.id });
    };

    const resizeObserver = new ResizeObserver(() => {
      draw();
    });
    resizeObserver.observe(host);

    host.addEventListener("wheel", onWheel, { passive: false });
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerup", onUp);
    const onContextMenu = (event: MouseEvent) => event.preventDefault();
    host.addEventListener("contextmenu", onContextMenu);
    host.addEventListener("click", onClick);
    const unsubscribe = services.selection.subscribe(draw);
    return () => {
      disposed = true;
      cameraRef.current = null;
      drawRef.current = null;
      resizeObserver.disconnect();
      unsubscribe();
      host.removeEventListener("wheel", onWheel);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("click", onClick);
      host.removeEventListener("contextmenu", onContextMenu);
      app.destroy(true);
    };
  }, [services]);
  return (
    <section className="stage-panel">
      <div className="stage-toolbar">
        <div className="stage-toolbar-left">
          <strong>Stage</strong>
          <span
            className="stage-info-badge"
            title="Mức phóng to và khoảng cách ô lưới caro hiện tại"
          >
            🔍 Zoom: {viewInfo.zoom}% · 📏 Lưới: {viewInfo.gridStep}
          </span>
          <span className="stage-selection">
            {selection
              ? `${selection.kind}: ${selection.id}`
              : "Nothing selected"}
          </span>
        </div>
        <div className="stage-toolbar-right">
          <button
            className="stage-btn"
            title="Thu nhỏ (-)"
            onClick={() => {
              if (cameraRef.current && drawRef.current) {
                cameraRef.current.setZoom(cameraRef.current.zoom * 0.8);
                drawRef.current();
              }
            }}
          >
            −
          </button>
          <button
            className="stage-btn"
            title="Phóng to (+)"
            onClick={() => {
              if (cameraRef.current && drawRef.current) {
                cameraRef.current.setZoom(cameraRef.current.zoom * 1.25);
                drawRef.current();
              }
            }}
          >
            +
          </button>
          <button
            className="stage-btn"
            title="Khôi phục góc nhìn mặc định 100%"
            onClick={() => {
              if (cameraRef.current && drawRef.current) {
                cameraRef.current.setZoom(1);
                cameraRef.current.setCenter({ x: 25, y: 75 });
                drawRef.current();
              }
            }}
          >
            100% (Reset)
          </button>
        </div>
      </div>
      <div className="stage-viewport">
        <div className="stage-corner" title="Đơn vị: pixel">
          px
        </div>
        <canvas ref={hRulerRef} className="stage-ruler-h" />
        <canvas ref={vRulerRef} className="stage-ruler-v" />
        <div ref={hostRef} className="pixi-stage" />
      </div>
    </section>
  );
}

function Hierarchy() {
  const services = useServices();
  const [, redraw] = useState(0);
  useEffect(() => {
    const a = services.selection.subscribe(() => redraw((n) => n + 1));
    const b = services.commands.subscribe(() => redraw((n) => n + 1));
    return () => {
      a();
      b();
    };
  }, [services]);
  const skeleton = (services.project as HboneProject).skeletons.main;
  const treeItems =
    skeleton?.bones.map((bone) =>
      bone.parentId
        ? { id: bone.id, name: bone.name, parentId: bone.parentId }
        : { id: bone.id, name: bone.name },
    ) ?? nodes;
  const tree = new HierarchyModel(treeItems);
  return (
    <section className="panel">
      <header>Hierarchy</header>
      {tree.items.map((item) => (
        <button
          className={
            services.selection.isSelected("bone", item.id)
              ? "selected tree-item"
              : "tree-item"
          }
          style={{ paddingLeft: item.parentId ? 24 : 10 }}
          key={item.id}
          onClick={() =>
            services.selection.select({ kind: "bone", id: item.id })
          }
        >
          ◈ {item.name}
        </button>
      ))}
    </section>
  );
}

function Inspector() {
  const services = useServices();
  const selected = services.selection.current;
  const [, redraw] = useState(0);
  useEffect(
    () => services.selection.subscribe(() => redraw((n) => n + 1)),
    [services],
  );
  return (
    <section className="panel">
      <header>Inspector</header>
      {selected ? (
        <>
          <p className="muted">
            {selected.kind} / {selected.id}
          </p>
          <label>
            Name
            <input
              key={selected.id}
              defaultValue={selected.id}
              onBlur={(event) => {
                const val = event.target.value.trim();
                if (!val || val === selected.id) return;
                const prev = selected.id;
                const kind = selected.kind;
                const command = {
                  id: `rename-${prev}`,
                  label: `Rename ${prev} to ${val}`,
                  execute: (ctx: Record<string, unknown>) => {
                    const project = ctx.project as HboneProject;
                    const bone = project.skeletons.main?.bones.find(
                      (item) => item.id === prev,
                    );
                    if (bone) bone.name = val;
                    services.selection.select({ kind, id: prev });
                  },
                  undo: (ctx: Record<string, unknown>) => {
                    const project = ctx.project as HboneProject;
                    const bone = project.skeletons.main?.bones.find(
                      (item) => item.id === prev,
                    );
                    if (bone) bone.name = prev;
                    services.selection.select({ kind, id: prev });
                  },
                };
                services.commands.execute(command, val);
              }}
            />
          </label>
          <p className="muted">Edits are routed through CommandHistory.</p>
        </>
      ) : (
        <p className="muted">Select an item in Hierarchy.</p>
      )}
    </section>
  );
}

function Timeline() {
  const services = useServices();
  const [store] = useState(() => new AnimationAuthoringStore());
  const [clipId, setClipId] = useState<string | null>(null);
  const [playback] = useState(() => new AuthoringPlayback(1, 30));
  const [events] = useState(() => new EventAuthoringTrack(1));
  const [authoringHistory] = useState(() => new AuthoringHistory());
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(1);
  const [rowScrollTop, setRowScrollTop] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const boxSelectionRef = useRef<number | null>(null);
  const [boxSelection, setBoxSelection] = useState<
    { start: number; end: number } | undefined
  >();
  const [clipboard, setClipboard] = useState<KeyClipboard | null>(null);
  const [autoKeyMode, setAutoKeyMode] = useState<AutoKeyMode>("off");
  const [eventName, setEventName] = useState("event");
  const [eventPayload, setEventPayload] = useState("{}");
  const [bezierHandles, setBezierHandles] = useState({
    cx1: 0.25,
    cy1: 0.1,
    cx2: 0.75,
    cy2: 0.9,
  });
  const [fitGraphSelection, setFitGraphSelection] = useState(false);
  const [snapInterval, setSnapInterval] = useState(1 / 30);
  const [slotTargetId, setSlotTargetId] = useState("");
  const [constraintTargetId, setConstraintTargetId] = useState("");
  const nudgeSelectedValues = (delta: number) => {
    if (!store.view.selectedKeyIds.size) return;
    store.runAtomic(
      authoringHistory,
      `Nudge values ${delta > 0 ? "+1" : "-1"}`,
      () => store.offsetNumericValues([...store.view.selectedKeyIds], delta),
    );
    redraw((value) => value + 1);
  };
  const [, redraw] = useState(0);
  useEffect(
    () => services.selection.subscribe(() => redraw((value) => value + 1)),
    [services],
  );
  const clip = store.active;
  const clips = store.clips;
  const previewLog = events.preview(0, playback.time, playback.loop);
  const skeleton = (services.project as HboneProject).skeletons.main;
  const specialTargetId = (kind: "slot" | "constraint") =>
    kind === "slot"
      ? slotTargetId || skeleton?.slots[0]?.id || "slot"
      : constraintTargetId || skeleton?.constraints[0]?.id || "constraint";
  const selectedBoneId =
    services.selection.current?.kind === "bone"
      ? services.selection.current.id
      : "root";
  const rowWindow = virtualizeRows(store.view.rows, rowScrollTop, 220, 24);
  const selectedNumericValue = clip?.channels
    .flatMap((channel) => channel.keys)
    .find(
      (key) =>
        store.view.selectedKeyIds.has(key.id) && typeof key.value === "number",
    )?.value as number | undefined;
  const selectedValue = clip?.channels
    .flatMap((channel) => channel.keys)
    .find((key) => store.view.selectedKeyIds.has(key.id))?.value;
  const syncEventTrack = () => {
    events.clear();
    const eventChannel = store.active?.channels.find(
      (channel) => channel.kind === "event",
    );
    for (const key of eventChannel?.keys ?? []) {
      if (!key.value || typeof key.value !== "object") continue;
      const value = key.value as { name?: unknown; payload?: unknown };
      events.upsert(
        key.id,
        key.time,
        typeof value.name === "string" ? value.name : "event",
        value.payload,
      );
    }
  };
  const graphChannel = clip?.channels.find((channel) =>
    channel.keys.some(
      (key) =>
        store.view.selectedKeyIds.has(key.id) && typeof key.value === "number",
    ),
  );
  const graphKeys =
    graphChannel?.keys.filter(
      (key): key is typeof key & { value: number } =>
        typeof key.value === "number",
    ) ?? [];
  const graphRange = graphKeys.length
    ? fitGraphRange(
        graphKeys,
        fitGraphSelection ? [...store.view.selectedKeyIds] : undefined,
      )
    : undefined;
  const graphPath = graphRange
    ? graphKeys.reduce((path, key, index) => {
        const x =
          ((key.time - graphRange.start) /
            (graphRange.end - graphRange.start)) *
          640;
        const y =
          150 -
          ((key.value - graphRange.valueMin) /
            (graphRange.valueMax - graphRange.valueMin)) *
            150;
        if (index === 0) return `M ${x} ${y}`;
        const previous = graphKeys[index - 1]!;
        const previousX =
          ((previous.time - graphRange.start) /
            (graphRange.end - graphRange.start)) *
          640;
        const previousY =
          150 -
          ((previous.value - graphRange.valueMin) /
            (graphRange.valueMax - graphRange.valueMin)) *
            150;
        if (previous.curve.type === "stepped") return `${path} H ${x} V ${y}`;
        if (previous.curve.type === "bezier") {
          const dx = x - previousX;
          const dy = y - previousY;
          return `${path} C ${previousX + dx * previous.curve.cx1} ${previousY + dy * previous.curve.cy1} ${x - dx * (1 - previous.curve.cx2)} ${y - dy * (1 - previous.curve.cy2)} ${x} ${y}`;
        }
        return `${path} L ${x} ${y}`;
      }, "")
    : "";
  useEffect(() => {
    const skeleton = (services.project as HboneProject).skeletons.main;
    const animation = skeleton?.animations[0];
    if (!store.active && animation) {
      const imported = store.importClip(
        animation as Parameters<typeof store.importClip>[0],
        skeleton.fps,
      );
      setClipId(imported.id);
      playback.duration = imported.duration;
      syncEventTrack();
      redraw((value) => value + 1);
    }
  }, [services, store]);
  useEffect(() => {
    if (!playback.playing) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      playback.advance((now - previous) / 1000);
      previous = now;
      redraw((value) => value + 1);
    }, 16);
    return () => window.clearInterval(timer);
  }, [playback, playback.playing]);
  useEffect(() => {
    const viewport = timelineRef.current;
    if (!viewport || !clip || clip.duration <= 0) return;
    const contentWidth = Math.max(viewport.scrollWidth, viewport.clientWidth);
    const timelineWidth = Math.max(contentWidth - 150, 1);
    const playheadX = 150 + (playback.time / clip.duration) * timelineWidth;
    const leftBound = viewport.scrollLeft + 170;
    const rightBound = viewport.scrollLeft + viewport.clientWidth - 30;
    if (playheadX < leftBound || playheadX > rightBound) {
      viewport.scrollLeft = Math.max(
        0,
        playheadX - viewport.clientWidth * 0.65,
      );
    }
  }, [clip?.duration, clip?.id, playback.playing, playback.time]);
  const createClip = () => {
    const created = store.create("walk", 1, 30);
    store.addChannel({
      id: `${selectedBoneId}.rotate`,
      kind: "bone",
      targetId: selectedBoneId,
      property: "rotate",
    });
    store.syncRows();
    setClipId(created.id);
    redraw((value) => value + 1);
  };
  const duplicateClip = () => {
    if (!clip) return;
    const copy = store.duplicate(clip.id);
    store.select(copy.id);
    setClipId(copy.id);
    playback.duration = copy.duration;
    playback.fps = copy.fps;
    redraw((value) => value + 1);
  };
  const deleteClip = () => {
    if (!clip) return;
    store.delete(clip.id);
    const next = store.active;
    setClipId(next?.id ?? null);
    playback.duration = next?.duration ?? 1;
    playback.fps = next?.fps ?? 30;
    playback.seek(0);
    redraw((value) => value + 1);
  };
  const togglePlay = () => {
    playback.playing = !playback.playing;
    redraw((value) => value + 1);
  };
  const toggleLoop = () => {
    playback.loop = !playback.loop;
    redraw((value) => value + 1);
  };
  const addMarker = () => {
    const marker = {
      id: `marker-${Date.now()}`,
      time: playback.time,
      label: `Marker ${store.view.markers.length + 1}`,
    };
    const before = [...store.view.markers];
    const after = [...before, marker];
    authoringHistory.execute({
      label: "Add timeline marker",
      do: () => store.setMarkers(after),
      undo: () => store.setMarkers(before),
    });
    redraw((value) => value + 1);
  };
  const removeMarker = (markerId: string) => {
    const before = [...store.view.markers];
    const after = before.filter((marker) => marker.id !== markerId);
    authoringHistory.execute({
      label: "Remove timeline marker",
      do: () => store.setMarkers(after),
      undo: () => store.setMarkers(before),
    });
    redraw((value) => value + 1);
  };
  const addRotationKey = () => {
    addTransformKey("rotate");
  };
  const addTransformKey = (property: string) => {
    if (!clip) return;
    store.runAtomic(authoringHistory, `Add ${property} key`, () => {
      const id = `${selectedBoneId}.${property}`;
      const channel =
        store.active?.channels.find((item) => item.id === id) ??
        store.addChannel({
          id,
          kind: "bone",
          targetId: selectedBoneId,
          property,
        });
      const value = property.startsWith("scale") ? 1 : 0;
      store.upsertKey(channel.id, playback.time, value, { type: "linear" });
      store.syncRows();
    });
    redraw((value) => value + 1);
  };
  const setSelectedCurve = (curve: "linear" | "stepped") => {
    store.runAtomic(authoringHistory, `Set ${curve} curve`, () =>
      store.setKeyCurve([...store.view.selectedKeyIds], { type: curve }),
    );
    redraw((value) => value + 1);
  };
  const setSelectedBezier = () => {
    store.runAtomic(authoringHistory, "Set Bezier handles", () =>
      store.setBezierHandles([...store.view.selectedKeyIds], bezierHandles),
    );
    redraw((value) => value + 1);
  };
  const deleteSelectedKeys = () => {
    store.runAtomic(authoringHistory, "Delete selected keys", () =>
      store.removeKeys([...store.view.selectedKeyIds]),
    );
    redraw((value) => value + 1);
  };
  const duplicateSelectedKeys = () => {
    store.runAtomic(authoringHistory, "Duplicate selected keys", () =>
      store.duplicateKeys(
        [...store.view.selectedKeyIds],
        1 / (clip?.fps ?? 30),
      ),
    );
    redraw((value) => value + 1);
  };
  const moveSelectedKeys = (frames: number) => {
    store.runAtomic(authoringHistory, "Move selected keys", () =>
      store.moveKeys(
        [...store.view.selectedKeyIds],
        frames / (clip?.fps ?? 30),
        snapInterval,
      ),
    );
    redraw((value) => value + 1);
  };
  const scaleSelectedKeys = () => {
    if (!clip || !store.view.selectedKeyIds.size) return;
    store.runAtomic(authoringHistory, "Scale selected keys", () =>
      store.scaleKeys([...store.view.selectedKeyIds], playback.time, 0.5),
    );
    redraw((value) => value + 1);
  };
  const addEvent = () => {
    let payload: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(eventPayload) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        payload = parsed as Record<string, unknown>;
      }
    } catch {
      return;
    }
    const normalizedEventName = eventName.trim() || "event";
    if (
      !events.definitions.some(
        (definition) => definition.name === normalizedEventName,
      )
    ) {
      events.addDefinition({
        id: normalizedEventName.toLowerCase().replace(/\s+/g, "-"),
        name: normalizedEventName,
      });
    }
    events.upsert(
      `event-${events.events.length + 1}`,
      playback.time,
      normalizedEventName,
      payload,
    );
    const eventChannel =
      store.active?.channels.find((channel) => channel.kind === "event") ??
      store.addChannel({
        id: "events",
        kind: "event",
        property: "event",
      });
    store.upsertKey(eventChannel.id, playback.time, {
      name: eventName.trim() || "event",
      payload,
    });
    store.syncRows();
    redraw((value) => value + 1);
  };
  const addSpecialChannel = (kind: "slot" | "constraint", property: string) => {
    const targetId = specialTargetId(kind);
    const id = `${kind}.${targetId}.${property}`;
    if (!store.active?.channels.some((channel) => channel.id === id)) {
      store.addChannel({
        id,
        kind,
        targetId,
        property,
      });
      store.syncRows();
      redraw((value) => value + 1);
    }
  };
  const addChannelKey = (channelId: string) => {
    const channel = store.active?.channels.find(
      (item) => item.id === channelId,
    );
    if (!channel || !clip) return;
    const value =
      channel.kind === "slot" && channel.property === "attachment"
        ? "default"
        : channel.kind === "slot" && channel.property !== "drawOrder"
          ? "ffffffff"
          : 0;
    store.runAtomic(authoringHistory, "Add timeline key", () => {
      if (autoKeyMode === "off")
        store.upsertKey(channel.id, playback.time, value);
      else store.autoKeyValue(channel.id, playback.time, value);
    });
    redraw((value) => value + 1);
  };
  const copySelectedKeys = () => {
    const channel = clip?.channels.find((item) =>
      item.keys.some((key) => store.view.selectedKeyIds.has(key.id)),
    );
    if (channel)
      setClipboard(copyKeys(channel, [...store.view.selectedKeyIds]));
  };
  const pasteClipboard = () => {
    const channel =
      clip?.channels.find((item) => item.id === clipboard?.sourceChannelId) ??
      clip?.channels[0];
    if (!channel || !clipboard || !clip) return;
    store.runAtomic(authoringHistory, "Paste timeline keys", () => {
      store.pasteClipboard(clipboard, channel.id, playback.time);
    });
    redraw((value) => value + 1);
  };
  const selectTimeRange = () => {
    store.selectKeysInBox(selectionStart, selectionEnd);
    redraw((value) => value + 1);
  };
  const pointerTime = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!clip || !timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const width = Math.max(timelineRef.current.scrollWidth - 150, 1);
    return Math.max(
      0,
      Math.min(
        clip.duration,
        ((event.clientX - rect.left - 150 + timelineRef.current.scrollLeft) /
          width) *
          clip.duration,
      ),
    );
  };
  const beginBoxSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const time = pointerTime(event);
    boxSelectionRef.current = time;
    setBoxSelection({ start: time, end: time });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const updateBoxSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (boxSelectionRef.current === null) return;
    setBoxSelection({
      start: boxSelectionRef.current,
      end: pointerTime(event),
    });
  };
  const finishBoxSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (boxSelectionRef.current === null) return;
    const end = pointerTime(event);
    store.selectKeysInBox(boxSelectionRef.current, end);
    boxSelectionRef.current = null;
    setBoxSelection(undefined);
    redraw((value) => value + 1);
  };
  const applyToProject = () => {
    if (!clip) return;
    const nextAnimation = store.exportActive();
    const skeletonBefore = (services.project as HboneProject).skeletons.main;
    const previousAnimation = skeletonBefore?.animations.find(
      (animation) => animation.id === nextAnimation.id,
    );
    const previousEvents = skeletonBefore?.events
      ? [...skeletonBefore.events]
      : [];
    const authoredEvents = events.definitions.map((definition) => ({
      id: definition.id,
      name: definition.name,
    }));
    services.commands.execute({
      id: `apply-animation-${nextAnimation.id}`,
      label: `Apply animation ${nextAnimation.name}`,
      execute: (context) => {
        const project = context.project as HboneProject;
        const skeleton = project.skeletons.main;
        if (!skeleton) return;
        skeleton.animations = [
          ...skeleton.animations.filter(
            (animation) => animation.id !== nextAnimation.id,
          ),
          nextAnimation as HboneProject["skeletons"][string]["animations"][number],
        ];
        skeleton.events = authoredEvents;
      },
      undo: (context) => {
        const project = context.project as HboneProject;
        const skeleton = project.skeletons.main;
        if (skeleton)
          skeleton.animations = [
            ...skeleton.animations.filter(
              (animation) => animation.id !== nextAnimation.id,
            ),
            ...(previousAnimation ? [previousAnimation] : []),
          ];
        if (skeleton) skeleton.events = previousEvents;
      },
    });
  };
  return (
    <section
      className="panel timeline-panel"
      tabIndex={0}
      onKeyDown={(event) => {
        const mod = event.ctrlKey || event.metaKey;
        if (event.key === "Delete") {
          event.preventDefault();
          deleteSelectedKeys();
        } else if (mod && event.key.toLowerCase() === "d") {
          event.preventDefault();
          duplicateSelectedKeys();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          moveSelectedKeys(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          moveSelectedKeys(1);
        }
      }}
    >
      <header className="timeline-header">
        <span>Timeline</span>
        <div>
          <button onClick={createClip}>New animation</button>
          <button onClick={duplicateClip} disabled={!clip}>
            Duplicate
          </button>
          <button onClick={deleteClip} disabled={!clip}>
            Delete
          </button>
        </div>
      </header>
      {clip ? (
        <>
          <label>
            Animation{" "}
            <select
              value={clip.id}
              onChange={(event) => {
                store.select(event.target.value);
                const next = store.active;
                setClipId(next?.id ?? null);
                playback.duration = next?.duration ?? 1;
                playback.fps = next?.fps ?? 30;
                playback.seek(0);
                redraw((value) => value + 1);
              }}
            >
              {clips.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="timeline-metadata">
            <label>
              Name{" "}
              <input
                value={clip.name}
                onChange={(event) => {
                  store.rename(clip.id, event.target.value);
                  redraw((value) => value + 1);
                }}
              />
            </label>
            <label>
              Duration{" "}
              <input
                type="number"
                min={0}
                step={0.1}
                value={clip.duration}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value) && value >= 0) {
                    store.setMetadata(clip.id, { duration: value });
                    playback.duration = value;
                    redraw((current) => current + 1);
                  }
                }}
              />
            </label>
            <label>
              FPS{" "}
              <input
                type="number"
                min={1}
                step={1}
                value={clip.fps}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value) && value > 0) {
                    store.setMetadata(clip.id, { fps: value });
                    playback.fps = value;
                    redraw((current) => current + 1);
                  }
                }}
              />
            </label>
          </div>
          <div className="timeline-controls">
            <button onClick={() => playback.seek(0)}>◀</button>
            <button onClick={togglePlay}>
              {playback.playing ? "Pause" : "Play"}
            </button>
            <button onClick={() => playback.step(-1)}>Frame -1</button>
            <button onClick={() => playback.step(1)}>Frame +1</button>
            <button onClick={addMarker}>Add marker</button>
            <button onClick={addRotationKey}>
              Key rotation ({selectedBoneId})
            </button>
            <button onClick={() => addTransformKey("x")}>Key X</button>
            <button onClick={() => addTransformKey("y")}>Key Y</button>
            <button onClick={() => addTransformKey("scaleX")}>
              Key scale X
            </button>
            <button onClick={() => addTransformKey("scaleY")}>
              Key scale Y
            </button>
            <button onClick={() => addTransformKey("skewX")}>Key skew X</button>
            <button onClick={() => addTransformKey("skewY")}>Key skew Y</button>
            <button onClick={addEvent}>Add event</button>
            <label>
              Auto-key{" "}
              <select
                value={autoKeyMode}
                onChange={(event) => {
                  const mode = event.target.value as AutoKeyMode;
                  setAutoKeyMode(mode);
                  store.setAutoKey(mode);
                }}
              >
                <option value="off">Off</option>
                <option value="changed-property">Changed</option>
                <option value="first-frame">First frame</option>
              </select>
            </label>
            <button
              onClick={copySelectedKeys}
              disabled={!store.view.selectedKeyIds.size}
            >
              Copy
            </button>
            <button onClick={pasteClipboard} disabled={!clipboard}>
              Paste
            </button>
            <button onClick={applyToProject}>Apply to project</button>
            <button
              onClick={() => {
                authoringHistory.undo();
                syncEventTrack();
                redraw((value) => value + 1);
              }}
              disabled={!authoringHistory.canUndo}
            >
              Undo authoring
            </button>
            <button
              onClick={() => {
                authoringHistory.redo();
                syncEventTrack();
                redraw((value) => value + 1);
              }}
              disabled={!authoringHistory.canRedo}
            >
              Redo authoring
            </button>
            <label>
              Slot target{" "}
              <select
                value={slotTargetId || skeleton?.slots[0]?.id || "slot"}
                onChange={(event) => setSlotTargetId(event.target.value)}
              >
                {(skeleton?.slots.length
                  ? skeleton.slots
                  : [{ id: "slot" }]
                ).map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.id}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => addSpecialChannel("slot", "attachment")}>
              Attachment
            </button>
            <button onClick={() => addSpecialChannel("slot", "color")}>
              Color
            </button>
            <button onClick={() => addSpecialChannel("slot", "twoColor")}>
              Two-color
            </button>
            <button onClick={() => addSpecialChannel("slot", "drawOrder")}>
              Draw order
            </button>
            <label>
              Constraint target{" "}
              <select
                value={
                  constraintTargetId ||
                  skeleton?.constraints[0]?.id ||
                  "constraint"
                }
                onChange={(event) => setConstraintTargetId(event.target.value)}
              >
                {(skeleton?.constraints.length
                  ? skeleton.constraints
                  : [{ id: "constraint" }]
                ).map((constraint) => (
                  <option key={constraint.id} value={constraint.id}>
                    {constraint.id}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => addSpecialChannel("constraint", "ikMix")}>
              IK mix
            </button>
            <button
              onClick={() => addSpecialChannel("constraint", "transformMix")}
            >
              Transform mix
            </button>
            <button
              onClick={() => addSpecialChannel("constraint", "pathPosition")}
            >
              Path position
            </button>
            <button
              onClick={() => addSpecialChannel("constraint", "pathSpacing")}
            >
              Path spacing
            </button>
            <button onClick={() => addSpecialChannel("constraint", "physics")}>
              Physics
            </button>
            <button onClick={toggleLoop}>
              {playback.loop ? "Loop on" : "Loop off"}
            </button>
            <label>
              Loop{" "}
              <input
                className="timeline-loop-input"
                type="number"
                min={0}
                max={clip.duration}
                step={1 / clip.fps}
                value={playback.loopStart}
                onChange={(event) =>
                  playback.setLoopRange(
                    Number(event.target.value),
                    playback.loopEnd,
                  )
                }
              />
              –
              <input
                className="timeline-loop-input"
                type="number"
                min={0}
                max={clip.duration}
                step={1 / clip.fps}
                value={playback.loopEnd}
                onChange={(event) =>
                  playback.setLoopRange(
                    playback.loopStart,
                    Number(event.target.value),
                  )
                }
              />
            </label>
            <label>
              Snap (s){" "}
              <input
                className="timeline-loop-input"
                type="number"
                min={0}
                step={1 / clip.fps}
                value={snapInterval}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value) && value >= 0)
                    setSnapInterval(value);
                }}
              />
            </label>
            <button
              onClick={() => setSelectedCurve("linear")}
              disabled={!store.view.selectedKeyIds.size}
            >
              Linear
            </button>
            <button
              onClick={() => setSelectedCurve("stepped")}
              disabled={!store.view.selectedKeyIds.size}
            >
              Stepped
            </button>
            <button
              onClick={setSelectedBezier}
              disabled={!store.view.selectedKeyIds.size}
            >
              Bezier
            </button>
            {(["cx1", "cy1", "cx2", "cy2"] as const).map((handle) => (
              <label key={handle}>
                {handle}{" "}
                <input
                  className="timeline-loop-input"
                  type="number"
                  min={handle.startsWith("cx") ? 0 : -2}
                  max={handle.startsWith("cx") ? 1 : 2}
                  step={0.05}
                  value={bezierHandles[handle]}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value))
                      setBezierHandles((current) => ({
                        ...current,
                        [handle]: value,
                      }));
                  }}
                />
              </label>
            ))}
            <label>
              Value{" "}
              <input
                className="timeline-loop-input"
                type={selectedNumericValue === undefined ? "text" : "number"}
                disabled={selectedValue === undefined}
                value={
                  typeof selectedValue === "string"
                    ? selectedValue
                    : (selectedNumericValue ?? 0)
                }
                onChange={(event) => {
                  const value =
                    selectedNumericValue === undefined
                      ? event.target.value
                      : Number(event.target.value);
                  if (typeof value === "string" || Number.isFinite(value)) {
                    store.runAtomic(authoringHistory, "Set key values", () =>
                      store.setValues([...store.view.selectedKeyIds], value),
                    );
                    redraw((current) => current + 1);
                  }
                }}
              />
            </label>
            <button
              onClick={() => nudgeSelectedValues(-1)}
              disabled={!store.view.selectedKeyIds.size}
            >
              Value −1
            </button>
            <button
              onClick={() => nudgeSelectedValues(1)}
              disabled={!store.view.selectedKeyIds.size}
            >
              Value +1
            </button>
            <button
              onClick={duplicateSelectedKeys}
              disabled={!store.view.selectedKeyIds.size}
            >
              Duplicate
            </button>
            <button
              onClick={deleteSelectedKeys}
              disabled={!store.view.selectedKeyIds.size}
            >
              Delete
            </button>
            <button
              onClick={() => moveSelectedKeys(-1)}
              disabled={!store.view.selectedKeyIds.size}
            >
              ← Frame
            </button>
            <button
              onClick={() => moveSelectedKeys(1)}
              disabled={!store.view.selectedKeyIds.size}
            >
              Frame →
            </button>
            <button
              onClick={scaleSelectedKeys}
              disabled={!store.view.selectedKeyIds.size}
            >
              Scale ×0.5
            </button>
            <label>
              Select{" "}
              <input
                className="timeline-loop-input"
                type="number"
                min={0}
                step={1 / clip.fps}
                value={selectionStart}
                onChange={(event) =>
                  setSelectionStart(Number(event.target.value))
                }
              />
              –
              <input
                className="timeline-loop-input"
                type="number"
                min={0}
                step={1 / clip.fps}
                value={selectionEnd}
                onChange={(event) =>
                  setSelectionEnd(Number(event.target.value))
                }
              />
            </label>
            <button onClick={selectTimeRange}>Select range</button>
            <label>
              Speed{" "}
              <select
                value={playback.speed}
                onChange={(event) => {
                  playback.speed = Number(event.target.value);
                  redraw((value) => value + 1);
                }}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
              </select>
            </label>
            <output>
              F{Math.round(playback.time * clip.fps)} / F
              {Math.round(clip.duration * clip.fps)} ·{" "}
              {playback.time.toFixed(3)}s / {clip.duration.toFixed(3)}s
            </output>
          </div>
          {store.view.markers.length > 0 && (
            <div className="timeline-markers">
              {store.view.markers.map((marker) => (
                <span key={marker.id}>
                  <button onClick={() => playback.seek(marker.time)}>
                    {marker.label} @ {marker.time.toFixed(2)}s
                  </button>
                  <button onClick={() => removeMarker(marker.id)}>×</button>
                </span>
              ))}
            </div>
          )}
          <input
            className="timeline-scrubber"
            type="range"
            min={0}
            max={clip.duration}
            step={1 / clip.fps}
            value={playback.time}
            onChange={(event) => playback.seek(Number(event.target.value))}
          />
          <div className="timeline-graph" aria-label="Graph editor">
            <div className="timeline-graph-header">
              <strong>Graph</strong>
              <button onClick={() => setFitGraphSelection(false)}>
                Fit all
              </button>
              <button
                onClick={() => setFitGraphSelection(true)}
                disabled={!store.view.selectedKeyIds.size}
              >
                Fit selection
              </button>
            </div>
            {graphRange && graphChannel ? (
              <svg
                viewBox="0 0 640 160"
                role="img"
                aria-label="Animation curve graph"
              >
                {Array.from({ length: 9 }, (_, index) => {
                  const x = (index / 8) * 640;
                  const y = 150 - (index / 8) * 150;
                  return (
                    <g key={`grid-${index}`} className="timeline-graph-grid">
                      <line x1={x} y1="0" x2={x} y2="150" />
                      <line x1="0" y1={y} x2="640" y2={y} />
                    </g>
                  );
                })}
                <line x1="0" y1="150" x2="640" y2="150" />
                <line x1="0" y1="0" x2="0" y2="150" />
                <path fill="none" d={graphPath} />
                {graphKeys.map((key) => {
                  const x =
                    ((key.time - graphRange.start) /
                      (graphRange.end - graphRange.start)) *
                    640;
                  const y =
                    150 -
                    ((key.value - graphRange.valueMin) /
                      (graphRange.valueMax - graphRange.valueMin)) *
                      150;
                  return <circle key={key.id} cx={x} cy={y} r="4" />;
                })}
              </svg>
            ) : (
              <span className="muted">
                Select numeric keys to edit their curve.
              </span>
            )}
          </div>
          {boxSelection && (
            <small className="muted">
              Box select:{" "}
              {Math.min(boxSelection.start, boxSelection.end).toFixed(3)}s–
              {Math.max(boxSelection.start, boxSelection.end).toFixed(3)}s
            </small>
          )}
          <div
            className="timeline-grid timeline-virtual-scroll"
            ref={timelineRef}
            onScroll={(event) => setRowScrollTop(event.currentTarget.scrollTop)}
            onPointerDown={beginBoxSelection}
            onPointerMove={updateBoxSelection}
            onPointerUp={finishBoxSelection}
          >
            <div
              style={{ height: rowWindow.totalHeight, position: "relative" }}
            >
              <div className="timeline-labels">
                <div style={{ height: rowWindow.offsetTop }} />
                {rowWindow.items.map((row) => (
                  <span key={row.id}>
                    <button
                      onClick={() => addChannelKey(row.channelId ?? row.id)}
                    >
                      +
                    </button>{" "}
                    {row.label}
                  </span>
                ))}
              </div>
            </div>
            <div
              style={{ height: rowWindow.totalHeight, position: "relative" }}
            >
              <div className="timeline-keys">
                <div style={{ height: rowWindow.offsetTop }} />
                {rowWindow.items.map((row) => (
                  <div key={row.id} className="timeline-row">
                    {(
                      clip.channels.find(
                        (channel) => channel.id === row.channelId,
                      )?.keys ?? []
                    ).map((key) => (
                      <button
                        key={key.id}
                        className="timeline-key"
                        title={`${key.time}s`}
                        onClick={(event) => {
                          playback.seek(key.time);
                          const selected = new Set(store.view.selectedKeyIds);
                          if (event.ctrlKey || event.metaKey) {
                            if (selected.has(key.id)) selected.delete(key.id);
                            else selected.add(key.id);
                            store.selectKeys([...selected]);
                          } else {
                            store.selectKeys([key.id]);
                          }
                          redraw((value) => value + 1);
                        }}
                        aria-pressed={store.view.selectedKeyIds.has(key.id)}
                        onDoubleClick={() => {
                          store.selectKeys([key.id]);
                          redraw((value) => value + 1);
                        }}
                        style={{ left: `${(key.time / clip.duration) * 100}%` }}
                      >
                        ◆
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="timeline-events">
            <strong>Events</strong>
            <label>
              Name{" "}
              <input
                value={eventName}
                onChange={(event) => setEventName(event.target.value)}
              />
            </label>
            <label>
              Payload{" "}
              <input
                value={eventPayload}
                onChange={(event) => setEventPayload(event.target.value)}
              />
            </label>
            <button onClick={addEvent}>Add event at playhead</button>
            {events.events.map((event) => (
              <button key={event.id} onClick={() => playback.seek(event.time)}>
                {event.name} @ {event.time.toFixed(2)}s
              </button>
            ))}
            {events.definitions.length > 0 && (
              <small className="muted">
                Definitions:{" "}
                {events.definitions
                  .map((definition) => definition.name)
                  .join(", ")}
              </small>
            )}
            <small className="muted">
              Preview log:{" "}
              {previewLog.length
                ? previewLog
                    .map(
                      (entry) =>
                        `${entry.name ?? "event"}: ${JSON.stringify(entry.value)} @ ${entry.absoluteTime.toFixed(2)}s`,
                    )
                    .join(" · ")
                : "none"}
            </small>
          </div>
        </>
      ) : (
        <p className="muted">Create an animation to edit keys.</p>
      )}
      {clipId && <small className="muted">Active clip: {clipId}</small>}
    </section>
  );
}

const layout: IJsonModel = {
  global: { tabEnableClose: false, tabSetEnableMaximize: true },
  borders: [],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        id: "hierarchy",
        weight: 22,
        children: [{ type: "tab", name: "Hierarchy", component: "hierarchy" }],
      },
      {
        type: "tabset",
        id: "stage",
        weight: 56,
        children: [{ type: "tab", name: "Stage", component: "stage" }],
      },
      {
        type: "tabset",
        id: "inspector",
        weight: 22,
        children: [{ type: "tab", name: "Inspector", component: "inspector" }],
      },
      {
        type: "tabset",
        id: "timeline",
        weight: 28,
        children: [{ type: "tab", name: "Timeline", component: "timeline" }],
      },
    ],
  },
};

function createSampleSkeleton(): SkeletonData {
  return {
    id: "hero-skeleton",
    name: "Hero",
    coordinateSystem: "x-right-y-up-ccw-radians",
    fps: 30,
    bones: [
      {
        id: "root",
        name: "root",
        length: 0,
        setup: {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
      {
        id: "body",
        name: "Body",
        parentId: "root",
        length: 80,
        setup: {
          x: 0,
          y: 80,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
      {
        id: "hand",
        name: "Hand",
        parentId: "body",
        length: 45,
        setup: {
          x: 55,
          y: 55,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
      {
        id: "head",
        name: "Head",
        parentId: "root",
        length: 40,
        setup: {
          x: -5,
          y: 70,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
        },
        inherit: "normal",
      },
    ],
    slots: [],
    skins: [],
    constraints: [],
    animations: [],
    events: [],
  };
}

function createSampleProject(): HboneProject {
  return createProject({ main: createSampleSkeleton() });
}

class BrowserProjectRepository extends InMemoryProjectRepository {
  constructor() {
    super();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("rigora.fs.")) {
          const path = key.slice("rigora.fs.".length);
          const base64 = localStorage.getItem(key);
          if (base64) {
            const binary = Uint8Array.from(atob(base64), (c) =>
              c.charCodeAt(0),
            );
            void super.write(path, binary);
          }
        }
      }
    } catch {
      // Ignore storage access issues
    }
  }

  override async write(path: string, bytes: Uint8Array): Promise<void> {
    await super.write(path, bytes);
    try {
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!);
      }
      localStorage.setItem(`rigora.fs.${path}`, btoa(binary));
    } catch {
      // Ignore quota issues
    }
  }

  override async remove(path: string): Promise<void> {
    await super.remove(path);
    try {
      localStorage.removeItem(`rigora.fs.${path}`);
    } catch {
      // Ignore storage access issues
    }
  }
}

function downloadFile(filename: string, bytes: Uint8Array): void {
  const blob = new Blob([bytes as BlobPart], {
    type: "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function App() {
  const repo = useMemo(() => new BrowserProjectRepository(), []);
  const lifecycle = useMemo(() => new ProjectLifecycle(repo), [repo]);
  const [project, setProject] = useState<HboneProject>(() => {
    const p = createSampleProject();
    lifecycle.newProject(p, true);
    return p;
  });
  const [projectName, setProjectName] = useState("hero.hbone");
  const [recoveryPrompt, setRecoveryPrompt] = useState<HboneProject | null>(
    null,
  );
  const [autosaveStatus, setAutosaveStatus] = useState("Autosaved");
  const authoringDocumentRef = useRef(createAuthoringDocument());
  useEffect(() => {
    if (typeof project.editorState === "string") {
      try {
        authoringDocumentRef.current = parseAuthoringDocument(
          project.editorState,
        );
      } catch {
        authoringDocumentRef.current = createAuthoringDocument();
      }
    }
  }, [project.editorState]);

  const projectRef = useRef(project);
  projectRef.current = project;

  const autosaveManager = useMemo(() => new AutosaveManager(repo), [repo]);
  const autosaveController = useMemo(
    () =>
      new AutosaveController(
        autosaveManager,
        projectName,
        () => projectRef.current,
        { debounceMs: 1500 },
      ),
    [autosaveManager, projectName],
  );

  const services = useMemo(
    () =>
      createEditorServices(
        project,
        new EditorPreferencesStore(new BrowserPreferences()),
      ),
    [],
  );

  const [canUndo, setCanUndo] = useState(services.commands.canUndo);
  const [canRedo, setCanRedo] = useState(services.commands.canRedo);
  const [isDirty, setIsDirty] = useState(services.commands.isDirty);
  const demoWeightsRef = useRef<Record<string, Record<string, number>>>({
    v0: { bone: 1 },
  });
  const demoAuthoringMesh = useMemo(
    () =>
      createAuthoringMesh(
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
        [0, 1, 2],
      ),
    [],
  );
  const paintThroughHistory = () => {
    const weights = demoWeightsRef.current;
    const deltas = applyWeightBrush(weights, ["v0"], "painted", "add", 0.25);
    const sparse = createWeightDeltaCommand(
      weights,
      deltas,
      "Weight brush stroke",
    );
    services.commands.execute({
      id: sparse.id,
      label: sparse.label,
      execute: () => sparse.execute(),
      undo: () => sparse.undo(),
    });
    const nextDocument = persistMesh(
      authoringDocumentRef.current,
      demoAuthoringMesh,
    );
    nextDocument.deformOffsets["demo-mesh"] = [0, 0, 0, 0, 0, 0];
    authoringDocumentRef.current = nextDocument;
    setProject((current) => ({
      ...current,
      editorState: serializeAuthoringDocument(nextDocument),
    }));
  };

  useEffect(() => {
    return services.commands.subscribe(() => {
      setCanUndo(services.commands.canUndo);
      setCanRedo(services.commands.canRedo);
      const dirty = services.commands.isDirty;
      setIsDirty(dirty);
      if (dirty) {
        autosaveController.markDirty();
        setAutosaveStatus("Unsaved changes *");
      }
    });
  }, [services, autosaveController]);

  // Check for autosave recovery on startup
  useEffect(() => {
    void autosaveManager.recoverDetailed(projectName).then((res) => {
      if (res.ok && res.project) {
        setRecoveryPrompt(res.project);
      }
    });
  }, [autosaveManager, projectName]);

  // Periodic autosave debounce flush
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(async () => {
      try {
        await autosaveController.flush();
        const time = new Date().toLocaleTimeString();
        setAutosaveStatus(`Autosaved at ${time}`);
      } catch (err) {
        console.error("Autosave error", err);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isDirty, autosaveController]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    try {
      const bytes = serializeProject(projectRef.current);
      await repo.write(projectName, bytes);
      services.commands.markClean();
      await autosaveManager.clear(projectName);
      const time = new Date().toLocaleTimeString();
      setAutosaveStatus(`Saved at ${time}`);
    } catch (err) {
      console.error("Save error", err);
    }
  };

  const handleSaveAs = () => {
    const nextName = window.prompt("Tên file .hbone", projectName);
    if (!nextName?.trim()) return;
    const normalizedName = nextName.endsWith(".hbone")
      ? nextName
      : `${nextName}.hbone`;
    const bytes = serializeProject(projectRef.current);
    downloadFile(normalizedName, bytes);
    void repo.write(normalizedName, bytes).then(() => {
      setProjectName(normalizedName);
      services.commands.markClean();
      setAutosaveStatus(`Saved as ${normalizedName}`);
    });
  };

  const handleNew = () => {
    if (
      isDirty &&
      !window.confirm("Dự án có thay đổi chưa lưu. Bạn có chắc muốn tạo mới?")
    ) {
      return;
    }
    const newProj = createSampleProject();
    lifecycle.newProject(newProj, true);
    services.setProject(newProj);
    setProject(newProj);
    setProjectName("untitled.hbone");
    services.commands.clear();
    setAutosaveStatus("New project created");
  };

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const loaded = parseProject(new Uint8Array(buffer), {
        verifyChecksums: true,
      });
      lifecycle.newProject(loaded, true);
      services.setProject(loaded);
      setProject(loaded);
      setProjectName(file.name);
      services.commands.clear();
      setAutosaveStatus(`Loaded ${file.name}`);
    } catch (err) {
      alert(
        `Không thể nạp file .hbone: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRestoreRecovery = () => {
    if (!recoveryPrompt) return;
    lifecycle.newProject(recoveryPrompt, true);
    services.setProject(recoveryPrompt);
    setProject(recoveryPrompt);
    services.commands.clear();
    setRecoveryPrompt(null);
    setAutosaveStatus("Restored from autosave");
  };

  const handleDismissRecovery = async () => {
    await autosaveManager.clear(projectName);
    setRecoveryPrompt(null);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) {
          if (services.commands.canRedo) services.commands.redo();
        } else {
          if (services.commands.canUndo) services.commands.undo();
        }
      } else if (mod && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        if (services.commands.canRedo) services.commands.redo();
      } else if (mod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [services, projectName]);

  const [model, setModel] = useState(() => Model.fromJson(layout));
  const factory = (node: TabNode) =>
    node.getComponent() === "stage" ? (
      <Stage />
    ) : node.getComponent() === "hierarchy" ? (
      <Hierarchy />
    ) : node.getComponent() === "timeline" ? (
      <Timeline />
    ) : (
      <Inspector />
    );
  const onAction = (action: Action) => {
    const next = model.doAction(action);
    if (next) {
      setModel(next);
      services.preferences.saveLayout({
        ...services.preferences.loadLayout(),
        panels: services.preferences.loadLayout().panels,
      });
    }
    return action;
  };
  return (
    <ServicesContext.Provider value={services}>
      <div className="app">
        <header className="topbar">
          <strong>RIGORA</strong>
          <span className={`project-badge ${isDirty ? "dirty" : ""}`}>
            {projectName}
            {isDirty ? " *" : ""}
          </span>
          <div className="btn-group">
            <button onClick={handleNew} title="New project">
              New
            </button>
            <button onClick={handleOpenClick} title="Open project (.hbone)">
              Open
            </button>
            <button onClick={handleSave} title="Save project (Ctrl+S)">
              Save
            </button>
            <button onClick={handleSaveAs} title="Download project (.hbone)">
              Save As
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".hbone"
              style={{ display: "none" }}
              onChange={handleFileSelected}
            />
          </div>
          <div className="btn-group">
            <button
              disabled={!canUndo}
              onClick={() => services.commands.undo()}
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              disabled={!canRedo}
              onClick={() => services.commands.redo()}
              title="Redo (Ctrl+Y)"
            >
              Redo
            </button>
            <button
              onClick={paintThroughHistory}
              title="Apply a sparse authoring brush command"
            >
              Paint stroke
            </button>
          </div>
          <span className="autosave-status">{autosaveStatus}</span>
          <button onClick={() => setModel(Model.fromJson(layout))}>
            Reset layout
          </button>
        </header>
        {recoveryPrompt && (
          <div className="recovery-banner">
            <span>
              ⚠️ Phát hiện bản lưu tự động (Autosave) chưa lưu từ phiên làm việc
              trước.
            </span>
            <button onClick={handleRestoreRecovery}>Khôi phục</button>
            <button onClick={handleDismissRecovery}>Bỏ qua</button>
          </div>
        )}
        <div className="dock">
          <Layout model={model} factory={factory} onAction={onAction} />
        </div>
      </div>
    </ServicesContext.Provider>
  );
}

class BrowserPreferences {
  read(key: string) {
    return localStorage.getItem(key) ?? undefined;
  }
  write(key: string, value: string) {
    localStorage.setItem(key, value);
  }
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <TooltipProvider delayDuration={250}>
      <App />
    </TooltipProvider>
  </ErrorBoundary>,
);
