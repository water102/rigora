# Rigora developer and adapter guide

## Boundaries

- `@rigora/model` owns the format-neutral schema and validation.
- `@rigora/runtime` evaluates canonical poses and constraints.
- `@rigora/renderer-pixi` consumes runtime snapshots; renderer code does not
  define source-format semantics.
- `@rigora/format-*` packages translate source data at the boundary.
- `@rigora/project` owns `.hbone` persistence, checksums, migration and
  recovery.
- `@rigora/editor-core` owns commands, selection, hierarchy and inspection.

Keep source-version behavior in an adapter and return source-locatable
diagnostics for unsupported fields. Do not silently repair or discard source
data. New native format versions require an explicit migration in
`migrateProject()` and a fixture proving the original bytes remain untouched on
failure.

## Useful commands

```text
pnpm check
pnpm test:browser
pnpm benchmark:selection
node tools/benchmark-skinning.mjs
pnpm release:metadata
pnpm release:preflight
```

The project format API is exposed from `packages/project/src/index.ts`:
`createProject`, `serializeProject`, `parseProject`, `migrateProject`,
`ProjectLifecycle` and `AutosaveManager`.

## Clean-room and release rules

Spine adapters are independently authored from public format behavior and
owned fixtures. Do not vendor official runtime code. Record dependency and
asset provenance, regenerate the SBOM/notices after dependency changes, and
run the complete qualification suite before release.
