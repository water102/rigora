export interface CommandContext {
  [key: string]: unknown;
}

export interface EditorCommand<T = unknown> {
  id: string;
  label: string;
  execute(ctx: CommandContext, payload?: T): void;
  undo(ctx: CommandContext): void;
  merge?(next: EditorCommand<unknown>, nextPayload?: unknown): boolean;
}

export interface HistoryEntry {
  id: string;
  label: string;
}

export type SelectionKind =
  | "bone"
  | "slot"
  | "attachment"
  | "constraint"
  | "animation";

export interface Selection {
  kind: SelectionKind;
  id: string;
}

export type SelectionListener = (selection: Selection | null) => void;

/** UI selection state; deliberately excluded from authored command history. */
export class SelectionStore {
  #selection: Selection | null = null;
  readonly #listeners = new Set<SelectionListener>();

  get current(): Selection | null {
    return this.#selection ? { ...this.#selection } : null;
  }

  select(selection: Selection): void {
    if (this.isSelected(selection.kind, selection.id)) return;
    this.#selection = { ...selection };
    this.#emit();
  }

  toggle(selection: Selection): void {
    if (this.isSelected(selection.kind, selection.id)) this.clear();
    else this.select(selection);
  }

  deselect(kind: SelectionKind, id: string): void {
    if (this.isSelected(kind, id)) this.clear();
  }

  clear(): void {
    if (!this.#selection) return;
    this.#selection = null;
    this.#emit();
  }

  subscribe(listener: SelectionListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  isSelected(kind: SelectionKind, id: string): boolean {
    return this.#selection?.kind === kind && this.#selection.id === id;
  }

  #emit(): void {
    for (const listener of this.#listeners) listener(this.current);
  }
}

export interface Point2 {
  x: number;
  y: number;
}
export interface Bounds2 {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Stage camera in canonical world units; rendering backends apply the result. */
export class Camera2D {
  #center: Point2 = { x: 0, y: 0 };
  #zoom = 1;
  constructor(
    public viewportWidth = 1,
    public viewportHeight = 1,
    readonly minZoom = 0.05,
    readonly maxZoom = 50,
  ) {
    this.setViewport(viewportWidth, viewportHeight);
    if (!(minZoom > 0 && Number.isFinite(minZoom) && maxZoom >= minZoom))
      throw new Error("CAMERA_INVALID_ZOOM_BOUNDS");
  }
  get center(): Point2 {
    return { ...this.#center };
  }
  get zoom(): number {
    return this.#zoom;
  }
  setViewport(width: number, height: number): void {
    if (!(width > 0 && height > 0)) throw new Error("CAMERA_INVALID_VIEWPORT");
    this.viewportWidth = width;
    this.viewportHeight = height;
  }
  /** Moves the camera; positive deltas move world content in the opposite direction. */
  panBy(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy))
      throw new Error("CAMERA_INVALID_PAN");
    this.#center.x += dx / this.#zoom;
    this.#center.y += dy / this.#zoom;
  }
  setCenter(center: Point2): void {
    if (!Number.isFinite(center.x) || !Number.isFinite(center.y))
      throw new Error("CAMERA_INVALID_CENTER");
    this.#center = { ...center };
  }
  setZoom(zoom: number): void {
    if (!(zoom > 0 && Number.isFinite(zoom)))
      throw new Error("CAMERA_INVALID_ZOOM");
    this.#zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
  }
  zoomAt(factor: number, screen: Point2): void {
    if (!(factor > 0 && Number.isFinite(factor)))
      throw new Error("CAMERA_INVALID_ZOOM_FACTOR");
    if (!Number.isFinite(screen.x) || !Number.isFinite(screen.y))
      throw new Error("CAMERA_INVALID_SCREEN_POINT");
    const before = this.screenToWorld(screen);
    this.setZoom(this.#zoom * factor);
    const after = this.screenToWorld(screen);
    this.#center.x += before.x - after.x;
    this.#center.y += before.y - after.y;
  }
  worldToScreen(world: Point2): Point2 {
    return {
      x: (world.x - this.#center.x) * this.#zoom + this.viewportWidth / 2,
      y: (world.y - this.#center.y) * this.#zoom + this.viewportHeight / 2,
    };
  }
  screenToWorld(screen: Point2): Point2 {
    return {
      x: (screen.x - this.viewportWidth / 2) / this.#zoom + this.#center.x,
      y: (screen.y - this.viewportHeight / 2) / this.#zoom + this.#center.y,
    };
  }
  frameBounds(bounds: Bounds2, padding = 0.1): void {
    if (!(bounds.width >= 0 && bounds.height >= 0))
      throw new Error("CAMERA_INVALID_BOUNDS");
    if (!(padding >= 0 && Number.isFinite(padding)))
      throw new Error("STAGE_INVALID_PADDING");
    this.setCenter({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    });
    const paddedWidth = Math.max(bounds.width * (1 + padding * 2), 1e-6);
    const paddedHeight = Math.max(bounds.height * (1 + padding * 2), 1e-6);
    this.setZoom(
      Math.min(
        this.viewportWidth / paddedWidth,
        this.viewportHeight / paddedHeight,
      ),
    );
  }
}

export interface GridSettings {
  enabled: boolean;
  spacing: number;
  subdivisions: number;
}

export interface GridLine {
  axis: "x" | "y";
  position: number;
  major: boolean;
}

export function snapToGrid(value: number, spacing: number): number {
  if (!(spacing > 0 && Number.isFinite(spacing)))
    throw new Error("GRID_INVALID_SPACING");
  if (!Number.isFinite(value)) throw new Error("GRID_INVALID_VALUE");
  return Math.round(value / spacing) * spacing;
}

export function snapPointToGrid(point: Point2, spacing: number): Point2 {
  return { x: snapToGrid(point.x, spacing), y: snapToGrid(point.y, spacing) };
}

export function buildGridLines(
  bounds: Bounds2,
  settings: GridSettings,
): GridLine[] {
  if (!(settings.spacing > 0 && Number.isFinite(settings.spacing)))
    throw new Error("GRID_INVALID_SPACING");
  if (!Number.isInteger(settings.subdivisions) || settings.subdivisions < 1)
    throw new Error("GRID_INVALID_SUBDIVISIONS");
  if (!settings.enabled) return [];
  const minorSpacing = settings.spacing / settings.subdivisions;
  const lines: GridLine[] = [];
  const xStart = Math.ceil(bounds.x / minorSpacing);
  const xEnd = Math.floor((bounds.x + bounds.width) / minorSpacing);
  const yStart = Math.ceil(bounds.y / minorSpacing);
  const yEnd = Math.floor((bounds.y + bounds.height) / minorSpacing);
  for (let i = xStart; i <= xEnd; i++) {
    const position = i * minorSpacing;
    lines.push({ axis: "x", position, major: i % settings.subdivisions === 0 });
  }
  for (let i = yStart; i <= yEnd; i++) {
    const position = i * minorSpacing;
    lines.push({ axis: "y", position, major: i % settings.subdivisions === 0 });
  }
  return lines;
}

export function boundsFromPoints(points: readonly Point2[]): Bounds2 | null {
  if (points.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
      throw new Error("STAGE_NON_FINITE_POINT");
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function framePoints(
  camera: Camera2D,
  points: readonly Point2[],
  padding = 0.1,
): Bounds2 | null {
  const bounds = boundsFromPoints(points);
  if (bounds) camera.frameBounds(bounds, padding);
  return bounds;
}

interface UndoEntry {
  command: EditorCommand<unknown>;
  payload: unknown;
  beforeState: number;
  afterState: number;
}

export class CommandHistory {
  readonly #undo: UndoEntry[] = [];
  readonly #redo: UndoEntry[] = [];
  #activeTransaction: {
    label: string;
    commands: UndoEntry[];
    beforeState: number;
  } | null = null;
  #currentState = 0;
  #cleanState = 0;
  #nextState = 1;

  constructor(
    readonly context: CommandContext,
    readonly limit = 100,
  ) {}

  execute<T>(command: EditorCommand<T>, payload?: T): void {
    if (this.#activeTransaction) {
      command.execute(this.context, payload);
      this.#activeTransaction.commands.push({
        command: command as EditorCommand<unknown>,
        payload,
        beforeState: this.#currentState,
        afterState: this.#nextState++,
      });
      this.#currentState = this.#activeTransaction.commands.at(-1)!.afterState;
      return;
    }

    command.execute(this.context, payload);

    const last = this.#undo[this.#undo.length - 1];
    if (
      last &&
      last.command.merge?.(command as EditorCommand<unknown>, payload)
    ) {
      last.afterState = this.#nextState++;
      this.#currentState = last.afterState;
      this.#redo.length = 0;
      return;
    }

    this.#undo.push({
      command: command as EditorCommand<unknown>,
      payload,
      beforeState: this.#currentState,
      afterState: this.#nextState++,
    });
    this.#currentState = this.#undo.at(-1)!.afterState;

    if (this.#undo.length > this.limit) {
      this.#undo.shift();
    }

    this.#redo.length = 0;
  }

  beginTransaction(label = "Transaction"): void {
    if (this.#activeTransaction) {
      throw new Error("TRANSACTION_ALREADY_ACTIVE");
    }
    this.#activeTransaction = {
      label,
      commands: [],
      beforeState: this.#currentState,
    };
  }

  commitTransaction(): boolean {
    if (!this.#activeTransaction) return false;
    const tx = this.#activeTransaction;
    this.#activeTransaction = null;

    if (tx.commands.length === 0) return true;

    if (tx.commands.length === 1) {
      const single = tx.commands[0]!;
      const last = this.#undo[this.#undo.length - 1];
      if (last && last.command.merge?.(single.command, single.payload)) {
        last.afterState = this.#nextState++;
        this.#currentState = last.afterState;
        this.#redo.length = 0;
        return true;
      }
      single.beforeState = tx.beforeState;
      single.afterState = this.#nextState++;
      this.#undo.push(single);
      this.#currentState = single.afterState;
    } else {
      const entries = [...tx.commands];
      const compound: EditorCommand = {
        id: `transaction-${Date.now()}`,
        label: tx.label,
        execute(ctx) {
          for (const item of entries) {
            item.command.execute(ctx, item.payload);
          }
        },
        undo(ctx) {
          for (let i = entries.length - 1; i >= 0; i--) {
            entries[i]!.command.undo(ctx);
          }
        },
      };
      this.#undo.push({
        command: compound,
        payload: undefined,
        beforeState: tx.beforeState,
        afterState: this.#nextState++,
      });
      this.#currentState = this.#undo.at(-1)!.afterState;
    }

    if (this.#undo.length > this.limit) {
      this.#undo.shift();
    }

    this.#redo.length = 0;
    return true;
  }

  rollbackTransaction(): boolean {
    if (!this.#activeTransaction) return false;
    const tx = this.#activeTransaction;
    this.#activeTransaction = null;

    for (let i = tx.commands.length - 1; i >= 0; i--) {
      tx.commands[i]!.command.undo(this.context);
    }
    this.#currentState = tx.beforeState;
    return true;
  }

  transact<R>(fn: () => R, label = "Transaction"): R {
    this.beginTransaction(label);
    try {
      const result = fn();
      this.commitTransaction();
      return result;
    } catch (err) {
      this.rollbackTransaction();
      throw err;
    }
  }

  undo(): boolean {
    if (this.#activeTransaction) return false;
    const entry = this.#undo.pop();
    if (!entry) return false;
    entry.command.undo(this.context);
    this.#currentState = entry.beforeState;
    this.#redo.push(entry);
    return true;
  }

  redo(): boolean {
    if (this.#activeTransaction) return false;
    const entry = this.#redo.pop();
    if (!entry) return false;
    entry.command.execute(this.context, entry.payload);
    this.#currentState = entry.afterState;
    this.#undo.push(entry);
    return true;
  }

  markClean(): void {
    this.#cleanState = this.#currentState;
  }

  get isDirty(): boolean {
    return this.#currentState !== this.#cleanState;
  }

  clear(): void {
    this.#undo.length = 0;
    this.#redo.length = 0;
    this.#activeTransaction = null;
    this.#currentState = 0;
    this.#cleanState = 0;
  }

  get canUndo(): boolean {
    return !this.#activeTransaction && this.#undo.length > 0;
  }

  get canRedo(): boolean {
    return !this.#activeTransaction && this.#redo.length > 0;
  }

  get isInTransaction(): boolean {
    return this.#activeTransaction !== null;
  }

  get history(): HistoryEntry[] {
    return this.#undo.map(({ command }) => ({
      id: command.id,
      label: command.label,
    }));
  }
}
