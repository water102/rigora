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

## Build evidence

Captured on 2026-09-20 after installing Rustup and the stable MSVC toolchain:

| Bundle                       |            Size | SHA-256                                                            |
| ---------------------------- | --------------: | ------------------------------------------------------------------ |
| `Rigora_0.1.0_x64-setup.exe` | 2,005,840 bytes | `3A3A29212C4B57CA68C980A4ABF8B48FB87CE02B3A935D3A03723D575316F2BC` |
| `Rigora_0.1.0_x64_en-US.msi` | 2,953,216 bytes | `63FD36AA3C5A9AFFB535897FEF4E037349DEA13537B71BD0CD69B634613A7EE6` |

`pnpm release:verify-artifacts` reported both required bundle families present.
Install/upgrade/uninstall on a clean Windows machine remains a separate manual
qualification step. Current local results are recorded in
`docs/release/INSTALL_QUALIFICATION.md`.
