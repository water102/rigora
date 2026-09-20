# S00-P01-T01 — Repository Inventory Evidence

## Snapshot

- Captured: 2026-09-20 (workspace local time)
- Branch: `main`
- HEAD: `82679c8` (`chore: include LICENSE from remote repository`)
- Package manager: pnpm `10.16.1` (root `package.json`)
- Workspace declaration: `apps/*`, `packages/*` (`pnpm-workspace.yaml`)
- Inventory mode: read-only filesystem and manifest scan; no generated output was
  edited or committed.

## Top-level inventory

| Area         |  Files | Directories | Approx. bytes | Classification                                                            |
| ------------ | -----: | ----------: | ------------: | ------------------------------------------------------------------------- |
| `apps/`      |    165 |          59 |    19,208,755 | Product and compatibility-lab applications                                |
| `packages/`  |    175 |          97 |     1,180,701 | Workspace libraries and format/runtime packages                           |
| `tests/`     |     30 |           5 |       197,153 | Unit/integration test sources and fixtures                                |
| `docs/`      |    208 |          17 |     3,665,592 | Contracts, plans, specs, batches and execution pack                       |
| `tools/`     |     12 |           0 |        21,906 | Verification and release scripts                                          |
| `example/`   | 14,656 |       1,951 |   594,900,476 | Example corpus; treated as fixture/input data                             |
| `research/`  |     89 |          21 |    18,574,597 | Research evidence; not production source                                  |
| `src-tauri/` |  3,321 |         611 | 1,510,149,084 | Native shell and generated/native build material; requires separate audit |

Counts are a reproducible snapshot from PowerShell recursive file enumeration;
byte totals are informational and can vary when generated artifacts change.

## Workspace applications

| Package                     | Scripts                     | Role                            |
| --------------------------- | --------------------------- | ------------------------------- |
| `@rigora/editor-shell`      | `dev`, `build`, `typecheck` | Main product editor             |
| `@rigora/compatibility-lab` | `dev`, `build`, `typecheck` | Compatibility/import-export lab |

## Workspace libraries

All 16 packages expose `build` and `typecheck` scripts. The package set is:

`animation`, `authoring-mesh`, `diagnostics`, `editor-core`, `format-common`,
`format-dragonbones`, `format-export`, `format-spine-38`, `format-spine-42`,
`format-spine-common`, `math`, `model`, `project`, `renderer-pixi`, `runtime`.

## Tests and fixtures

- `tests/unit/`: 19 Vitest suites, 263 tests in the current passing baseline.
- `tests/`: 25 TypeScript files, 3 JSON files and 2 Markdown files in the
  recursive inventory; test setup/configuration is outside `tests/unit`.
- `example/`: large corpus and sample assets; do not treat corpus presence as
  product parity evidence without a targeted fixture/oracle record.
- No new fixture was added by this task.

## Documentation and evidence surfaces

- `docs/plans/active/`: authoritative parity scope.
- `docs/execution/`: roadmap, task schemas/templates, dependency decisions and
  this evidence record.
- `docs/contracts/`, `docs/spec/`, `docs/batches/`: architecture contracts,
  source specifications and historical implementation evidence.
- `docs/release/`: release qualification and artifact evidence.

## Build artifacts and audit boundaries

- `apps/*/dist/` and package build outputs are generated and must not be used as
  source-of-truth inventory evidence.
- `src-tauri/` is intentionally recorded as a large native boundary; generated
  native material, Cargo targets and platform artifacts need a dedicated follow-up
  before claiming a clean source inventory.
- Dependency graph and boundary-cycle analysis are explicitly deferred to
  `S00-P01-T02`; this task records the inventory inputs only.

## Reproduction commands

```powershell
Get-ChildItem apps,packages,tests,docs,tools,example,research,src-tauri -Recurse -File
Get-ChildItem apps -Directory | ForEach-Object { Get-Content (Join-Path $_.FullName 'package.json') }
Get-ChildItem packages -Directory | ForEach-Object { Get-Content (Join-Path $_.FullName 'package.json') }
pnpm check
```

The final command passed during this task: parity counts, typecheck, lint,
263 tests, and production builds.
