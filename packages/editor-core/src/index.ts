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

interface UndoEntry {
  command: EditorCommand<unknown>;
  payload: unknown;
}

export class CommandHistory {
  readonly #undo: UndoEntry[] = [];
  readonly #redo: UndoEntry[] = [];
  #activeTransaction: { label: string; commands: UndoEntry[] } | null = null;
  #cleanIndex = 0;

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
      });
      return;
    }

    command.execute(this.context, payload);

    const last = this.#undo[this.#undo.length - 1];
    if (
      last &&
      last.command.merge?.(command as EditorCommand<unknown>, payload)
    ) {
      this.#redo.length = 0;
      return;
    }

    this.#undo.push({
      command: command as EditorCommand<unknown>,
      payload,
    });

    if (this.#undo.length > this.limit) {
      this.#undo.shift();
      if (this.#cleanIndex >= 0) {
        this.#cleanIndex--;
      }
    }

    this.#redo.length = 0;
  }

  beginTransaction(label = "Transaction"): void {
    if (this.#activeTransaction) {
      throw new Error("TRANSACTION_ALREADY_ACTIVE");
    }
    this.#activeTransaction = { label, commands: [] };
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
        this.#redo.length = 0;
        return true;
      }
      this.#undo.push(single);
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
      this.#undo.push({ command: compound, payload: undefined });
    }

    if (this.#undo.length > this.limit) {
      this.#undo.shift();
      if (this.#cleanIndex >= 0) {
        this.#cleanIndex--;
      }
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
    this.#redo.push(entry);
    return true;
  }

  redo(): boolean {
    if (this.#activeTransaction) return false;
    const entry = this.#redo.pop();
    if (!entry) return false;
    entry.command.execute(this.context, entry.payload);
    this.#undo.push(entry);
    return true;
  }

  markClean(): void {
    this.#cleanIndex = this.#undo.length;
  }

  get isDirty(): boolean {
    return this.#undo.length !== this.#cleanIndex;
  }

  clear(): void {
    this.#undo.length = 0;
    this.#redo.length = 0;
    this.#activeTransaction = null;
    this.#cleanIndex = 0;
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
