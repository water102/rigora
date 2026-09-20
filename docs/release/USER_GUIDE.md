# Rigora quick start

## Verify the workspace

Install Node.js 22+, pnpm 10.16.1, then run:

```text
pnpm install
pnpm check
```

Use `pnpm --filter @rigora/editor-shell dev` for the editor shell or `pnpm
dev` for the compatibility lab. The desktop command (`pnpm tauri:dev`) also
requires Rust/Cargo.

## Typical workflow

1. Open or create a project in the editor.
2. Inspect the hierarchy and select a bone, slot or attachment.
3. Use the Inspector and stage tools to edit transforms and mesh weights.
4. Create animation keys in the timeline and scrub the result.
5. Save the native `.hbone` project. Autosave recovery is offered when a
   previous session left a recoverable snapshot.
6. Use the compatibility lab/export planner before exporting a source format.

## Import and compatibility

Rigora uses a canonical model and reports unsupported source features instead
of silently dropping them. Spine 3.8/3.8.75, Spine 4.2 and DragonBones support
are capability-subset claims, not vendor endorsement or full-runtime parity.
Always review the export planner diagnostics and preserve the original source
file.

## Recovery and limits

Native projects are checksummed and bounded during load. Corrupt archives,
unsafe archive paths and oversized assets are rejected. If an autosave is
reported as corrupt, keep the original project and investigate the diagnostic
before deleting recovery data.
