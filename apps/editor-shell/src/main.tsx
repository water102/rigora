import * as React from "react";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
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
} from "@rigora/editor-core";
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
  return (
    <section className="stage-panel">
      <div className="stage-toolbar">
        Stage{" "}
        <span>
          {selection
            ? `${selection.kind}: ${selection.id}`
            : "Nothing selected"}
        </span>
      </div>
      <div className="stage-grid">
        <div className="axis x" />
        <div className="axis y" />
        <div className="stage-card">
          Camera2D
          <br />
          <small>Grid · renderer · selection</small>
        </div>
      </div>
    </section>
  );
}

function Hierarchy() {
  const services = useServices();
  const tree = useMemo(() => new HierarchyModel(nodes), []);
  const [, redraw] = useState(0);
  useEffect(
    () => services.selection.subscribe(() => redraw((n) => n + 1)),
    [services],
  );
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
              defaultValue={selected.id}
              onBlur={(event) => {
                const command = {
                  id: "rename",
                  label: "Rename",
                  execute: () => undefined,
                  undo: () => undefined,
                };
                services.commands.execute(command, event.target.value);
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
    ],
  },
};

function App() {
  const services = useMemo(
    () =>
      createEditorServices(
        { skeletons: [] },
        new EditorPreferencesStore(new BrowserPreferences()),
      ),
    [],
  );
  const [model, setModel] = useState(() => Model.fromJson(layout));
  const factory = (node: TabNode) =>
    node.getComponent() === "stage" ? (
      <Stage />
    ) : node.getComponent() === "hierarchy" ? (
      <Hierarchy />
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
          <span>Editor Foundation</span>
          <button onClick={() => setModel(Model.fromJson(layout))}>
            Reset layout
          </button>
        </header>
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
