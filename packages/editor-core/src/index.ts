export interface CommandContext {
  [key: string]: unknown;
}
export interface EditorCommand<T = unknown> {
  id: string;
  label: string;
  execute(ctx: CommandContext, payload: T): void;
  undo(ctx: CommandContext): void;
  merge?(next: EditorCommand<T>): boolean;
}
export interface HistoryEntry {
  id: string;
  label: string;
}
export class CommandHistory {
  readonly #undo: Array<{ command: EditorCommand; payload: unknown }> = [];
  readonly #redo: Array<{ command: EditorCommand; payload: unknown }> = [];
  constructor(
    readonly context: CommandContext,
    readonly limit = 100,
  ) {}
  execute<T>(command: EditorCommand<T>, payload: T): void {
    command.execute(this.context, payload);
    this.#undo.push({ command, payload });
    if (this.#undo.length > this.limit) this.#undo.shift();
    this.#redo.length = 0;
  }
  undo(): boolean {
    const entry = this.#undo.pop();
    if (!entry) return false;
    entry.command.undo(this.context);
    this.#redo.push(entry);
    return true;
  }
  redo(): boolean {
    const entry = this.#redo.pop();
    if (!entry) return false;
    entry.command.execute(this.context, entry.payload);
    this.#undo.push(entry);
    return true;
  }
  get canUndo() {
    return this.#undo.length > 0;
  }
  get canRedo() {
    return this.#redo.length > 0;
  }
  get history(): HistoryEntry[] {
    return this.#undo.map(({ command }) => ({
      id: command.id,
      label: command.label,
    }));
  }
}
