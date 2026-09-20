# Git, Status and Reporting Protocol

## 1. Branch và ownership

- Branch đề xuất: `agent/<task-id>-<short-slug>`.
- Một branch chỉ giải quyết một task packet hoặc một chuỗi task đã ghi rõ.
- Không force-push, rebase branch dùng chung, xóa branch/tag hoặc sửa history nếu
  không được owner yêu cầu.
- Không stage/commit file ngoài ownership. Nếu thấy thay đổi lạ, giữ nguyên và
  ghi vào report.
- File single-owner cần reservation/lock trong tracker trước khi sửa.

## 2. Commit boundary

Mỗi commit phải build được trong phạm vi hợp lý và có một mục đích:

1. contract/schema/migration;
2. core implementation;
3. product UI/command integration;
4. tests/fixtures/evidence;
5. docs/ledger/handoff.

Có thể gộp boundary nhỏ, nhưng không trộn refactor không liên quan. Không commit
generated output, dependency lock hoặc formatted repository-wide diff nếu task
không yêu cầu.

## 3. Commit message

```text
<type>(<scope>): <imperative summary> [<TASK-ID>]

Requirements: UI-12, D43-03
Evidence: <test/fixture/report identifiers>
```

Type: `feat`, `fix`, `refactor`, `test`, `docs`, `perf`, `build`, `chore`.

Ví dụ:

```text
feat(problems): add navigable missing-asset diagnostics [S03-P06-T02]

Requirements: UI-12, D43-03
Evidence: problems-missing-asset.e2e, diagnostic-golden-014
```

## 4. Pre-commit checklist

- [ ] `git status --short` chỉ có file thuộc task hoặc file đã giải thích.
- [ ] `git diff --check` pass.
- [ ] Không có secret, token, absolute local path, debug dump hay binary ngoài ý muốn.
- [ ] Targeted tests pass.
- [ ] Typecheck/lint package pass.
- [ ] Public API, migration và diagnostics đã cập nhật.
- [ ] Task report ghi command thực tế và result.

Agent không được dùng `--no-verify` trừ khi task packet cho phép và report nêu lý
do. Không amend commit của người khác.

## 5. Trạng thái task

```text
Backlog → Needs Planning → Ready → In Progress → In Review → Verified → Done
                                  ↘ Blocked ↗
                                  ↘ Changes Requested ↗
```

- `Ready`: đủ Definition of Ready và dependency verified.
- `In Progress`: đã claim owner và ghi baseline.
- `In Review`: implementation/commit/report có đủ evidence.
- `Verified`: reviewer tái chạy acceptance quan trọng và ký.
- `Done`: tracker, ledger, docs/handoff đều cập nhật; không còn follow-up bắt buộc.
- `Blocked`: có blocker cụ thể, owner và điều kiện unblock.

Task `Done` không tự động làm requirement `Complete`; requirement có state tám
lớp theo `04_TRACKING_MODEL.md`.

## 6. Cập nhật khi hoàn thành

Trong cùng task/commit cuối, cập nhật:

1. task packet checklist và commit hash;
2. parity ledger: layer state, evidence, known deviation;
3. step plan: subplan/task status;
4. test/fixture catalog nếu thêm mới;
5. capability/compatibility matrix nếu behavior format thay đổi;
6. ADR/migration/provenance/dependency ledger nếu liên quan;
7. completion report.

Không sửa checkbox tổng thành `[x]` nếu còn child task chưa `Verified`.

## 7. Completion report bắt buộc

Report phải có:

- task/requirements/commit;
- outcome trước, chi tiết sau;
- file/package thay đổi;
- behavior và design decision;
- tests với command + pass/fail/count;
- fixtures/evidence/recording;
- compatibility, migration, performance, security, accessibility;
- dependencies/provenance;
- known limitations, follow-ups và rollback notes;
- trạng thái ledger trước/sau.

Không dùng các câu mơ hồ như “đã test đầy đủ”, “parity hoàn tất” hoặc “không có
rủi ro” nếu không có evidence tương ứng.

## 8. Phase handoff

Step owner chỉ handoff khi:

- mọi subplan required là `Verified`;
- integration/vertical-slice gate chạy trên clean checkout;
- freeze/ADR list rõ;
- deferred item có owner và không vi phạm exit gate;
- compatibility claim được cập nhật;
- performance và known-risk report đính kèm.

Dùng `templates/04_PHASE_HANDOFF_TEMPLATE.md`.
