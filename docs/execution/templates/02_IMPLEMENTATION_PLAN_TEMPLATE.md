# Implementation Plan — `<TASK-ID>`

## Baseline

- Commit/branch:
- Dirty files preserved:
- Commands run and results:
- Current observed behavior:

## Design

- Chosen strategy:
- Alternatives rejected:
- Invariants:
- Data flow/evaluation order:
- Transaction/undo boundary:
- Error/cancel behavior:

## Change map

| File/module | Change | Contract impact | Test |
| ----------- | ------ | --------------- | ---- |

## Dependency delta

- New/changed/removed package:
- Registry status (`KEEP | ADOPT | POC | DEV_ONLY | REFERENCE | BUILD | AVOID`):
- Requirement IDs and first call site:
- Upstream/tag/license/date checked:
- Runtime environments and bundle/memory risk:
- Adapter/fallback/removal path:
- PoC fixture/benchmark/security gate:
- SBOM/lockfile impact:

Use `None` nếu task không đổi dependency. Không để trống mục này.

## Work sequence

1. Failing test/fixture or reproducible baseline.
2. Contract/schema/migration.
3. Core implementation.
4. Command/product UI integration.
5. Diagnostics and edge cases.
6. Verification and performance.
7. Docs/ledger/report.

## Verification matrix

| Acceptance | Command/test | Oracle/tolerance | Evidence |
| ---------- | ------------ | ---------------- | -------- |

## Commit boundaries

| Commit | Included changes | Required green checks |
| ------ | ---------------- | --------------------- |

## Risks and rollback

- Risks:
- Stop conditions:
- Rollback/migration:
