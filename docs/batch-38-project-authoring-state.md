# Batch 38 — Project Authoring State Integration

Editor Shell now restores versioned authoring state from `HboneProject.editorState` with a guarded parser and writes the current authoring document back when a sparse brush command executes, so native save/autosave includes authoring metadata.
