# Batch 18: Stage Camera Abstraction

Adds `Camera2D` to `@rigora/editor-core`. It provides deterministic world/screen conversion, pan, zoom-at-cursor, viewport validation, and frame-to-bounds behavior without depending on a renderer or UI framework.

`panBy(dx, dy)` moves the camera center, so positive deltas move rendered world content in the opposite direction. A pointer-drag handler that wants content to follow the pointer should pass the negated pointer delta. Zoom is clamped to configurable `minZoom`/`maxZoom` bounds (defaults `0.05` and `50`).
