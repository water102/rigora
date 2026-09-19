# Batch 15: Command Bus and Undo/Redo

Adds `@rigora/editor-core` with a framework-independent command history. Commands execute against a caller-owned context, preserve payloads for redo, clear the redo branch after a new edit, and enforce a bounded undo history.
