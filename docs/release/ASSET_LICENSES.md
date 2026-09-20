# Asset, font and icon license record

## Product assets

| Asset                   | Location                               | Provenance                          | License/status                                                |
| ----------------------- | -------------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| Rigora application icon | `src-tauri/icons/icon.png`, `icon.ico` | Generated in-house for this project | Original project artwork; no third-party attribution required |

The repository contains no bundled third-party fonts. UI icons are supplied by
the application dependency graph and are covered by the generated dependency
notices/SBOM; they must remain included in public distributions.

Research images under `research/` are not product assets and must not be copied
into release packages without a separate provenance and license review.

## Clean-room record

Runtime and adapter behavior is authored from public format documentation,
owned/generated fixtures, observable file behavior and independent math. No
official proprietary runtime source or editor binary was vendored.
