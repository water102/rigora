# Task `S00-P01-T01` — Repository inventory

## Metadata

- Step/Subplan: STEP-00 / P01
- Requirement IDs: none (baseline task)
- Owner/Reviewer: Codex / pending reviewer
- Status/Priority/Estimate: In Review / P0 / 3 points
- Dependencies: none
- Branch: `main` (existing workspace branch; no branch mutation requested)

## Goal

Publish a reproducible inventory of repository areas, workspace applications and
packages, tests, fixtures, documentation and build/native boundaries.

## Scope

- Owned paths: `docs/execution/evidence/`, this task packet, queue status row.
- Read-only paths: `apps/`, `packages/`, `tests/`, `docs/`, `tools/`, `example/`,
  `research/`, `src-tauri/`, workspace manifests.
- High-risk/single-owner files: `package.json`, `pnpm-workspace.yaml` (read only).
- Public API/contracts: none changed.

## Required reading

- `docs/execution/steps/STEP-00-BASELINE-AND-REPRODUCIBILITY.md`
- `docs/execution/02_AI_AGENT_OPERATING_GUIDE.md`
- `docs/execution/03_GIT_STATUS_AND_REPORTING_PROTOCOL.md`
- `docs/execution/04_TRACKING_MODEL.md`
- `AGENTS.md`

## Inputs and outputs

- Inputs: workspace tree, package manifests, test/docs layout, current Git HEAD.
- Outputs: `docs/execution/evidence/S00-P01-T01-inventory.md`.
- Diagnostics: none; no product behavior changed.
- Migration/serialization impact: none.

## Acceptance criteria

- [x] Apps, packages, tests, docs, fixtures and native/build boundaries enumerated.
- [x] Snapshot commit, branch, package manager and reproduction commands recorded.
- [x] Generated/native areas and deferred dependency analysis called out.
- [x] No feature, contract, fixture or dependency changes introduced.

## Tests and evidence

- Targeted tests: `pnpm check:parity` — pass.
- Integration/E2E: not applicable; no runtime behavior changed.
- Fixture/oracle/tolerance: not applicable.
- Recording/report: inventory evidence file linked above.

## Constraints

- Forbidden changes: source, lockfile, generated build output, parity scope.
- Allowed dependencies: none.
- Provenance/license: no dependency or external asset added.
- Stop conditions: inconsistent workspace manifests or unresolvable generated/native boundary.

## Commit plan

1. Add inventory evidence and task packet.
2. Update bootstrap queue to `In Review`.
3. Run `git diff --check` and `pnpm check`.
4. Commit as `docs(execution): inventory repository baseline [S00-P01-T01]`.

## Final report

See `docs/execution/reports/S00-P01-T01-completion.md`.
