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
