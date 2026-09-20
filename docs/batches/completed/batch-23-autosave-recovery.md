# Batch 23: Autosave and Recovery Baseline

Adds `AutosaveManager` over `ProjectRepository`. Recovery snapshots use a separate suffix, are checksum-validated on restore, and can be cleared explicitly; the primary project file is never overwritten by autosave.

`recoverDetailed()` returns a safe missing/corrupt status for recovery UI, while `recover()` provides a project-or-undefined fallback. `AutosaveController` adds debounce and optional interval scheduling, plus explicit `flush()` and `start()`/`stop()` lifecycle control.
