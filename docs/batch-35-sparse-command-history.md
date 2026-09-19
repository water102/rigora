# Batch 35 — Sparse Command History Adapter

Adds a command-shaped adapter for weight deltas. A complete brush stroke can be registered as one command with deterministic execute/undo callbacks, allowing the existing editor `CommandHistory` to provide one-step undo/redo without storing full mesh snapshots.
