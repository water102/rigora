# Batch 6 region renderer

`@rigora/runtime.createSetupSnapshot` validates canonical skeleton data and emits format-neutral ordered regions plus debug bone endpoints. It is a setup-only reference evaluator. No animated playback, constraints, mesh, two-color tint or skin activation behavior is silently simulated. Unsupported active features return diagnostics without a snapshot. Alternative skin selection currently requires setup attachment IDs to exist in that skin; there is no logical-name fallback.

`@rigora/renderer-pixi.PixiRegionRenderer` consumes only snapshots and a caller-supplied map of texture IDs. Slots are rendered in snapshot order. Sprites are reused by slot ID, inactive sprites are destroyed, color/alpha and standard blend modes are applied. Missing textures or duplicate slots reject the submission and retain the previous scene. Destroying the renderer does not destroy shared textures/sources.

Canonical coordinates are Y-up; image pixels and screen coordinates are Y-down. The renderer applies C × world × C with region/original-size scaling. Sprites anchor at the center. Camera placement belongs to the caller's parent container, not the domain model. Debug overlays show origins and bone tips.

Atlas descriptors use top-left pixel coordinates: frame in the atlas, original untrimmed dimensions, optional trim offsets in the original image, and rotation 0 or 90 (Pixi GroupD8 value 2). Source dimensions and trim consistency are checked. This is a normalized atlas mapping API, not a Spine `.atlas` or DragonBones atlas-file parser. The implementation follows [Pixi texture documentation](https://pixijs.com/8.x/guides/components/textures) and isolates that dependency behind the renderer package.

`apps/compatibility-lab` is a small development preview: choose either synthetic source fixture, toggle skeleton debug and download pose JSON. `pnpm dev` starts the local Vite server. It intentionally labels itself setup-only; it is not the complete P1 Compatibility Lab and does not import arbitrary files or seek imported animations.

Verification: numeric tests for source-neutral geometry, screen transform, trim/rotation metadata, render order, object reuse, lifecycle and explicit unsupported behavior; a Chromium WebGL smoke test checks non-background pixels, identical images across source formats and debug toggle. `pnpm test:browser` requires `pnpm exec playwright install chromium` and built workspace packages. Full animated architectural proof and source oracle compatibility remain pending.
