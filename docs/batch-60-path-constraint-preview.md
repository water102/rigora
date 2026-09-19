# Batch 60: Path constraint preview

- Added deterministic polyline sampling for path constraint previews.
- Preview points include normalized tangents and support open/closed paths.
- Zero-length tangents return a safe zero vector; invalid sample counts are rejected.
- Validation: `pnpm check`.
