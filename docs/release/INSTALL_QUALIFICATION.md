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

Executed with `msiexec /i ... /qn /norestart`:

- install exit code: `1603`;
- no uninstall entry was left;
- no installed executable remained;
- Windows Installer rollback completed.

MSI clean-install qualification is not passing yet. The verbose log is retained
locally at `test-results/rigora-msi-install.log`; this remains a release
blocker until the MSI install path is corrected and rerun.
