# ADR-003 — All Editor Mutations Use Commands
Status: Accepted

## Decision
Persistent authoring changes must use the command bus.

## Consequences
Undo/redo, macros, scripting and AI share one mutation API.
