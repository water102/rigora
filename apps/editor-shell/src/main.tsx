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
  buildGridLines,
} from "@rigora/editor-core";
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
  AuthoringPlayback,
  EventAuthoringTrack,
  type AutoKeyMode,
  copyKeys,
  type KeyClipboard,
  virtualizeRows,
} from "@rigora/animation";
import "flexlayout-react/style/dark.css";
import "./style.css";

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

function Stage() {
  const services = useServices();
  const selection = services.selection.current;
  const hostRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const app = new Application();
    const camera = new Camera2D(1, 1);
    const grid = new Graphics();
    const skeleton = new Graphics();
    const fallbackBones = [
      { id: "root", x: 0, y: 0, tx: 0, ty: 80 },
      { id: "body", x: 0, y: 80, tx: 55, ty: 135 },
      { id: "hand", x: 55, y: 135, tx: 105, ty: 120 },
      { id: "head", x: 0, y: 80, tx: -5, ty: 150 },
    ];
    const draw = () => {
      const width = host.clientWidth || 640;
      const height = host.clientHeight || 420;
      camera.setViewport(width, height);
      grid.clear();
      const topLeft = camera.screenToWorld({ x: 0, y: 0 });
      const bottomRight = camera.screenToWorld({ x: width, y: height });
      const bounds = {
        x: topLeft.x,
        y: -bottomRight.y,
        width: bottomRight.x - topLeft.x,
        height: topLeft.y - bottomRight.y,
      };
      for (const line of buildGridLines(bounds, {
        enabled: true,
        spacing: 40,
        subdivisions: 4,
      })) {
        const a =
          line.axis === "x"
            ? camera.worldToScreen({ x: line.position, y: -bounds.y })
            : camera.worldToScreen({ x: bounds.x, y: -line.position });
        const b =
          line.axis === "x"
            ? camera.worldToScreen({
                x: line.position,
                y: -(bounds.y + bounds.height),
              })
            : camera.worldToScreen({
                x: bounds.x + bounds.width,
                y: -line.position,
              });
        grid
          .moveTo(a.x, a.y)
          .lineTo(b.x, b.y)
          .stroke({
            color: line.major ? 0x38516d : 0x203247,
            width: line.major ? 1 : 0.5,
          });
      }
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
        const a = camera.worldToScreen({ x: bone.x, y: -bone.y });
        const b = camera.worldToScreen({ x: bone.tx, y: -bone.ty });
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
    };
    void app
      .init({
        background: 0x111b2c,
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
      const rect = host.getBoundingClientRect();
      camera.zoomAt(event.deltaY < 0 ? 1.1 : 0.9, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
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
        camera.panBy(event.clientX - last.x, event.clientY - last.y);
        last = { x: event.clientX, y: event.clientY };
        draw();
      }
    };
    const onUp = () => {
      dragging = false;
    };
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const rect = host.getBoundingClientRect();
      const point = camera.screenToWorld({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
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
        Stage{" "}
        <span>
          {selection
            ? `${selection.kind}: ${selection.id}`
            : "Nothing selected"}{" "}
          · wheel zoom · middle/right drag pan
        </span>
      </div>
      <div ref={hostRef} className="pixi-stage" />
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
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(1);
  const [rowScrollTop, setRowScrollTop] = useState(0);
  const [clipboard, setClipboard] = useState<KeyClipboard | null>(null);
  const [autoKeyMode, setAutoKeyMode] = useState<AutoKeyMode>("off");
  const [eventName, setEventName] = useState("event");
  const [eventPayload, setEventPayload] = useState("{}");
  const [, redraw] = useState(0);
  const clip = store.active;
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
  useEffect(() => {
    const skeleton = (services.project as HboneProject).skeletons.main;
    const animation = skeleton?.animations[0];
    if (!store.active && animation) {
      store.importClip(
        animation as Parameters<typeof store.importClip>[0],
        skeleton.fps,
      );
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
  const createClip = () => {
    const created = store.create("walk", 1, 30);
    store.addChannel({
      id: "root.rotate",
      kind: "bone",
      targetId: "root",
      property: "rotate",
    });
    store.syncRows();
    setClipId(created.id);
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
  const addRotationKey = () => {
    const channel = store.active?.channels.find(
      (item) => item.id === "root.rotate",
    );
    if (!channel || !clip) return;
    store.upsertKey(channel.id, playback.time, 0, { type: "linear" });
    store.syncRows();
    redraw((value) => value + 1);
  };
  const setSelectedCurve = (curve: "linear" | "stepped") => {
    store.setKeyCurve([...store.view.selectedKeyIds], { type: curve });
    redraw((value) => value + 1);
  };
  const setSelectedBezier = () => {
    store.setBezierHandles([...store.view.selectedKeyIds], {
      cx1: 0.25,
      cy1: 0.1,
      cx2: 0.75,
      cy2: 0.9,
    });
    redraw((value) => value + 1);
  };
  const deleteSelectedKeys = () => {
    store.removeKeys([...store.view.selectedKeyIds]);
    redraw((value) => value + 1);
  };
  const duplicateSelectedKeys = () => {
    store.duplicateKeys([...store.view.selectedKeyIds], 1 / (clip?.fps ?? 30));
    redraw((value) => value + 1);
  };
  const moveSelectedKeys = (frames: number) => {
    store.moveKeys(
      [...store.view.selectedKeyIds],
      frames / (clip?.fps ?? 30),
      1 / (clip?.fps ?? 30),
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
    events.upsert(
      `event-${events.events.length + 1}`,
      playback.time,
      eventName.trim() || "event",
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
    const id = `${kind}.${property}`;
    if (!store.active?.channels.some((channel) => channel.id === id)) {
      store.addChannel({
        id,
        kind,
        targetId: kind === "slot" ? "slot" : "constraint",
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
    if (autoKeyMode === "off")
      store.upsertKey(channel.id, playback.time, value);
    else store.autoKeyValue(channel.id, playback.time, value);
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
    store.pasteClipboard(clipboard, channel.id, playback.time);
    redraw((value) => value + 1);
  };
  const selectTimeRange = () => {
    store.selectKeysInBox(selectionStart, selectionEnd);
    redraw((value) => value + 1);
  };
  const applyToProject = () => {
    if (!clip) return;
    const nextAnimation = store.exportActive();
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
      },
      undo: (context) => {
        const project = context.project as HboneProject;
        const skeleton = project.skeletons.main;
        if (skeleton)
          skeleton.animations = skeleton.animations.filter(
            (animation) => animation.id !== nextAnimation.id,
          );
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
        <button onClick={createClip}>
          {clip ? "Reset clip" : "New animation"}
        </button>
      </header>
      {clip ? (
        <>
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
            <button onClick={() => playback.step(1)}>Frame +1</button>
            <button onClick={addRotationKey}>Key rotation</button>
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
            <button onClick={() => addSpecialChannel("slot", "attachment")}>
              Attachment
            </button>
            <button onClick={() => addSpecialChannel("slot", "color")}>
              Color
            </button>
            <button onClick={() => addSpecialChannel("slot", "drawOrder")}>
              Draw order
            </button>
            <button onClick={() => addSpecialChannel("constraint", "ikMix")}>
              IK mix
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
                    store.setValues([...store.view.selectedKeyIds], value);
                    redraw((current) => current + 1);
                  }
                }}
              />
            </label>
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
              {playback.time.toFixed(3)}s / {clip.duration.toFixed(3)}s
            </output>
          </div>
          <input
            className="timeline-scrubber"
            type="range"
            min={0}
            max={clip.duration}
            step={1 / clip.fps}
            value={playback.time}
            onChange={(event) => playback.seek(Number(event.target.value))}
          />
          <div
            className="timeline-grid timeline-virtual-scroll"
            onScroll={(event) => setRowScrollTop(event.currentTarget.scrollTop)}
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
                        onClick={() => playback.seek(key.time)}
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
    <App />
  </ErrorBoundary>,
);
