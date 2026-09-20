# 64 — Phase 10: Release Readiness

## Scope

Phase 10 validates the release candidate after Phase 9 production hardening.
The qualification covers repository integrity, browser behavior, format
corpora, parser security, native bundles, and documented installation evidence.

## Batch 1 — native release qualification

- `pnpm tauri:build` completed with Cargo `1.98.1` and produced both configured
  Windows bundles.
- `pnpm release:verify-artifacts` confirmed non-empty MSI and NSIS artifacts:
  `Rigora_0.1.0_x64_en-US.msi` and `Rigora_0.1.0_x64-setup.exe`.
- `pnpm test:browser` passed `3/3` tests.
- Native security qualification passed `5/5` cases.
- Parser mutation qualification passed `20/20` cases.
- Internal corpus qualification passed `3/3` format suites.
- The aggregate `pnpm release:qualification` command completed with
  `all internal gates passed`.
- Repository qualification remains green: `pnpm check` passed with 263 tests.

## Installation evidence

The local Windows install/upgrade/uninstall evidence is recorded in
`docs/release/INSTALL_QUALIFICATION.md`. NSIS and elevated MSI install and
uninstall both passed on the qualification machine. A clean-machine,
cross-platform installation run remains a release-operations follow-up and is
not claimed by the automated qualification above.

## Release claim boundary

The current evidence supports a Windows release-candidate build with the
documented compatibility scope. It does not claim validation on other operating
systems, GPU vendors, or a clean machine that has not run the installer.
