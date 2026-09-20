# STEP-02 — Canonical Contracts, Commands and Document Core

## Outcome

Freeze nền tảng mà mọi feature sẽ dùng: canonical document, identity/reference,
selection, command/history, diagnostics, tasks, serialization/migration và shared
runtime contracts cho mọi entity/channel Spine 4.3.26.

## Preconditions

- STEP-01 passed; ledger chỉ ra mọi schema gap.
- Baseline model/project/editor-core/runtime packages chạy được.

## Primary areas

`@rigora/model`, `@rigora/math`, `@rigora/runtime`, `@rigora/editor-core`,
`@rigora/project`, `@rigora/diagnostics`, contract/reference-model docs.

## Subplans

### P01 — Canonical schema completion

- Full bone/slot/folder/attachment/skin/constraint/event/audio/animation/sequence.
- Slider constraint, transform property mapping, draw-order folders, per-skin atlas metadata.
- Stable IDs, reference integrity, deterministic creation/evaluation order.

### P02 — Conventions and invariants

- Freeze coordinate, angle, reflection, color/PMA, time/fractional frame, path/name conventions.
- Validation/repair boundaries; finite numbers, cycles, missing references.

### P03 — Command and history

- Command registry, transaction, merge/coalesce, sparse delta, rollback/cancel.
- One gesture/stroke = one undo; nested transactions và async task commit.
- Không cho product UI mutate model trực tiếp.

### P04 — Selection and editor state

- Stable entity/property/key/vertex IDs; single/toggle/range/box/lasso/history/groups.
- Tách persistent editor state và ephemeral interaction state.

### P05 — Diagnostics and background tasks

- Severity/code/entity/path/fix/provenance; Problems view-ready contract.
- Progress/cancel/retry/atomic completion; bounded resource and logs.

### P06 — Native file and migration

- `.hbone` superset, manifest/checksums/unknown preservation/atomic save.
- Migration chain, forward-version block, backup/recovery compare.

### P07 — Golden contract suite

- Minimal fixture cho mọi entity/channel.
- Serialize → reopen → serialize deterministic; command undo/redo qua save/reopen.

## Suggested task boundaries

- Một entity/constraint/channel family cho mỗi task.
- Command infrastructure tách khỏi feature commands.
- Migration version riêng một task; không rewrite toàn schema trong một commit.

## Gate

- Golden native round-trip bao phủ mọi entity/channel.
- Undo/redo/cancel deterministic; background task không partial commit.
- Không renderer/UI/source-format type trong canonical package.
- F1 contracts được ký; mọi breaking change sau đó cần ADR + migration.

## Handoff evidence

- API docs, schema fixtures, migration matrix, contract tests và F1 handoff.
