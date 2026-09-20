# STEP-01 — Parity Ledger and Capability Registry

## Outcome

Chuyển 209 feature requirement và 28 delta 4.3 (237 parity requirement) thành registry machine-readable,
có owner, dependency, trạng thái tám lớp, provenance, oracle và task mapping.

## Preconditions

- STEP-00 passed.
- `../../plans/active/SPINE_PARITY_PLAN.md` version-lock không còn thay đổi chưa review.

## Ownership

- Capability registry là single-owner; agent khác chỉ đề xuất patch/task.
- Không tự đổi description/source snapshot khi chưa có review.

## Subplans

### P01 — Ingest requirement catalog

- Parse UI/TREE/RIG/ASSET/TOOL/ATT/SKIN/WGT/CON/ANIM/DOPE/GRAPH/VIEW/EVT/IMP/EXP/PACK/CLI/SET.
- Parse D43-01..28 và owning requirement relationship.
- Validate unique ID, source link, baseline state và release priority.

### P02 — Dependency and ownership

- Gán primary step/subplan/package/owner/reviewer cho từng ID.
- Ghi cross-cutting dependency, single-owner contract và blocker.
- Phát hiện orphan và dependency cycle.

### P03 — Eight-layer state

- Chuyển baseline `P/F/L/R/M/V` thành 8 layer states có evidence.
- Không suy diễn `verified` từ docs hoặc symbol name.
- `not_applicable` phải có rationale/approval.

### P04 — Provenance and replication strategy

- Ghi `replicate/adapt/equivalent` cho UI/hotkey/icon/text/algorithm.
- Gắn source/license/permission, oracle, tolerance và UX deviation.

### P05 — Dashboard and CI policy

- Sinh summary theo step/prefix/layer; không cộng lab/foundation vào parity %.
- CI chặn duplicate, missing owner/evidence và Complete sai công thức.

## Suggested tasks

- Một task cho mỗi 2–4 prefix; task 8 point phải tách.
- Một task riêng cho D43 ownership và one-to-many mapping.
- Một task riêng cho dashboard/CI validation.

## Gate

- 237/237 parity requirement có owner, step, dependency, 8 layers và source.
- 28/28 delta có owning IDs/test family.
- 0 duplicate, orphan, cycle hoặc `Complete` không evidence.
- F0 scope/terminology/provenance policy được ký.

## Handoff evidence

- Registry JSON/YAML, validation report, dashboard snapshot và F0 handoff.
