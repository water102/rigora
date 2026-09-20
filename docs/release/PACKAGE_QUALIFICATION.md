# Windows package qualification

## Preflight

Run:

```text
pnpm release:preflight
```

The preflight confirms the package manifests exist and reports whether Cargo is
available.

## Required qualification command

```text
pnpm tauri:build
```

Expected artifacts are the configured NSIS and MSI bundles from
`src-tauri/tauri.conf.json`. On 2026-09-20 this command was attempted and
stopped before compilation because `cargo` was not available on PATH. No
package-qualified claim is made until the command completes and the generated
artifacts are installed in a clean Windows environment.

After a successful build, verify that both configured bundle families contain
non-empty files:

```text
pnpm release:verify-artifacts
```
