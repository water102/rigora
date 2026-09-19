# Batch 23: Autosave and Recovery Baseline

Adds `AutosaveManager` over `ProjectRepository`. Recovery snapshots use a separate suffix, are checksum-validated on restore, and can be cleared explicitly; the primary project file is never overwritten by autosave.
