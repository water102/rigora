# Batch 39 — Pointer Drag State

Adds a cancellable pointer interaction state machine for vertex moves and brush sessions. The state machine separates preview movement from commit/cancel, preserving stable IDs and making canvas pointer events safe to route into command transactions.
