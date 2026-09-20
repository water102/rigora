# Batch 36 — Editor History Integration

The editor shell now exposes a real sparse weight-brush command routed through the existing `CommandHistory`. The stroke is undoable/redoable as one command and marks the editor dirty for autosave.
