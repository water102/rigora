# Windows install qualification

## NSIS

Executed on 2026-09-20 with `Rigora_0.1.0_x64-setup.exe`:

- silent install exit code: `0`;
- `C:\Program Files\Rigora\rigora.exe` present;
- uninstall entry present;
- silent uninstall exit code: `0`;
- installation directory cleanup: clean.

NSIS install/uninstall qualification passes on this machine.

## MSI

An initial non-elevated silent invocation returned `1603` with Windows
Installer Error 1925 (insufficient per-machine privileges) and rolled back.

The corrected qualification was executed through UAC elevation (`RunAs`) with
`msiexec /i ... /qn /norestart`:

- install exit code: `0`;
- `C:\Program Files\Rigora\rigora.exe` present;
- uninstall entry present;
- uninstall exit code: `0`;
- installation directory cleanup: clean.

MSI install/uninstall qualification passes with administrator elevation. The
non-elevated 1603 log remains locally at `test-results/rigora-msi-install.log`
as evidence that per-machine packages must be run elevated.
