# Rigora

Batch 7 follows the new [LoongBones addendum](docs/loongbones-spec-addendum.md): exported mesh/weight schemas, stronger geometry/influence invariants and explicit DragonBones 6.0 recognition with unsupported-constraint diagnostics. See [Batch 7 report](docs/batch-7-mesh-db60.md). Next under the addendum is LBS/deform; imported animation playback and the P1 proof gate remain outstanding.

Batch 6 adds a setup-pose snapshot runtime, PixiJS 8 region renderer and a small dual-format preview. After `pnpm install` and `pnpm build`, run `pnpm dev` to open the Compatibility Lab locally. `pnpm test:browser` runs the Chromium WebGL smoke test after installing Playwright Chromium. See [renderer contract](docs/renderer-contract.md). This preview does not yet play imported animations.

Batch 5 adds transactional Spine 3.8 and DragonBones 5.5 setup-pose importers with version checks, canonical name resolution, region mapping, diagnostics and synthetic dual-format numeric tests. See [import contract](docs/import-contract.md) for API, texture metadata requirements and unsupported features.

Batch 4 adds `@rigora/animation`: compiled numeric timelines, cursor lookup, linear/stepped/Bezier interpolation, explicit rotation policies, loop/clamp sampling and forward event crossing with seek baselines. See [animation contract](docs/animation-contract.md). Applying these channels to a complete runtime pose remains integration work.

Implementation of the HNN Bones specification in `spec/`.

Requires Node.js 22+ and pnpm 10.16.1.

```sh
pnpm install
pnpm check
```

Batch 1 provides strict TypeScript packages, diagnostic collection and JSON/Markdown reports, canonical math types, Vitest, formatting, foundation dependency checks, and CI configuration. `pnpm --filter @rigora/diagnostics build` builds an individual package with declarations.

Canonical coordinates are X right, Y up, counter-clockwise radians. Source specifications are preserved unchanged. No official Spine runtime code is used.

Batch 2 now provides `@rigora/model`: schema-derived canonical types, strict JSON boundary validation, bone/linked-mesh cycle detection, unique IDs, scoped references, mesh indices/weights, timeline ordering, provenance, and deterministic versioned skeleton snapshots. A synthetic canonical fixture covers round-trip and invalid inputs.

Public APIs: `validateSkeleton(unknown)` returns a discriminated result with source-locatable diagnostics; `serializeSkeletonSnapshot(unknown)` and `parseSkeletonSnapshot(string)` validate on both boundaries. Snapshot JSON is a testing artifact, not the production `.hbone` ZIP format.

Batch 3 adds affine operations, local transforms, all five canonical inheritance strategies, scale-aware inversion, world/local conversion, deterministic authoring decomposition and preserve-world reparenting. Transform-only hierarchy helpers compile dense parent-first indices and evaluate setup matrices. See [transform contract](docs/transform-contract.md) for canonical semantics, numeric guards and limitations.

Remaining before freezing F0: project/asset envelope and cross-skeleton/texture references; per-channel timeline value schemas and event payload references; full compatibility fixture corpus and source numerical oracles. Timeline values currently follow the broad `JsonValue` contract from the supplied TypeScript spec. Stable IDs are stored and checked, not generated from display names. No full runtime or editor is implemented yet.
