# Tracking Model

## 1. Ba cấp trạng thái

### Program/step

`Planned → Active → Gate Review → Passed → Frozen`

### Task

`Backlog → Needs Planning → Ready → In Progress → In Review → Verified → Done`

### Requirement capability

Theo dõi độc lập tám lớp:

`model`, `runtime`, `editor`, `command`, `import`, `export`, `tests`, `performance`.

Mỗi layer dùng:

- `missing`
- `foundation`
- `lab`
- `partial`
- `implemented`
- `verified`
- `not_applicable` — chỉ hợp lệ khi có approved exception.

## 2. Công thức Complete

Requirement chỉ là `Complete` khi:

```text
mọi layer applicable = verified
AND product workflow evidence = pass
AND save/reopen + undo/redo/cancel = pass khi applicable
AND no silent loss
AND provenance/license = accepted
AND không còn blocker severity Critical/High
```

Nếu feature không có import/export trực tiếp, layer đó vẫn cần `not_applicable`
có rationale thay vì để trống.

## 3. ID cho công việc

```text
S<step>-P<subplan>-T<task>
```

Ví dụ `S07-P04-T03` là task thứ 3 của subplan multi-mesh trong Step 07.

Defect: `BUG-<requirement>-<sequence>`.  
ADR: `ADR-<sequence>-<slug>`.  
Fixture: `FX-<domain>-<sequence>-<slug>`.

## 4. Trường bắt buộc của task

- `id`, `title`, `step`, `subplan`, `requirements`;
- `owner`, `reviewer`, `status`, `priority`, `estimate`;
- `dependencies`, `owned_paths`, `read_only_paths`, `high_risk_files`;
- `required_docs`, `interfaces`, `fixtures`, `oracles`;
- `acceptance`, `tests`, `performance_budget`;
- `forbidden_changes`, `allowed_dependencies`, `provenance`;
- `branch`, `commits`, `evidence`, `report`;
- `blocked_by`, `known_deviations`, `follow_ups`.

Schema: `schemas/task.schema.json`.

## 5. Trường bắt buộc của parity ledger

- requirement ID và canonical description;
- owning step/subplan/tasks/owner;
- dependency IDs và priority;
- 8 layer states + evidence từng layer;
- replication strategy: `replicate`, `adapt`, `equivalent`;
- provenance/license/permission;
- oracle, tolerance, fixture và tests;
- UX deviation, compatibility loss và diagnostics;
- current status, reviewer, verified commit/date;
- exception record nếu có.

Schema: `schemas/parity-ledger.schema.json`.

## 6. Quy tắc tự động hóa tracker

- CI fail nếu requirement/task ID không tồn tại hoặc evidence link rỗng khi set
  `verified`.
- CI fail nếu có duplicate ID, dependency cycle hoặc task `Ready` phụ thuộc task
  chưa `Verified`.
- CI fail nếu `Complete` nhưng còn layer applicable khác `verified`.
- CI cảnh báo khi code thay đổi package mà không có task ownership.
- Dashboard không được cộng `foundation`, `lab`, `partial` vào phần trăm parity.

## 7. Exception

Exception phải có owner, rationale, user impact, workaround, target release,
expiry/review date và approval. `N/A` vì “khó”, “chưa cần” hoặc “đã có trong
lab” không hợp lệ đối với baseline 4.3.26.
