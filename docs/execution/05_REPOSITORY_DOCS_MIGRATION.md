# Repository Documentation Migration

## 1. Vì sao cần migration

Source hiện tại đã có nhiều tài liệu agent/phase/batch, nhưng baseline cũ tập
trung Spine 3.8.75, subset 4.2 và batches 74–82. Chúng vẫn hữu ích về kiến trúc,
song không còn là full parity roadmap cho target 4.3.26.

## 2. Xử lý tài liệu cũ

| Existing document                           | Action                                                     | Lý do                                                      |
| ------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `21_AI_AGENT_IMPLEMENTATION_GUIDE.md`       | Supersede bằng guide mới hoặc thêm banner/link             | Thiếu workflow commit/status/evidence và policy 4.3        |
| `43_IMPLEMENTATION_AGENT_WORK_BREAKDOWN.md` | Giữ làm historical low-level backlog; không dùng làm scope | Dừng giữa breakdown và không phủ editor parity             |
| `44_MASTER_EXECUTION_PLAN.md`               | Mark superseded; link master roadmap mới                   | End state cũ chỉ 3.8 + subset 4.2                          |
| `45`–`54` phase plans                       | Archive/reference cho implemented foundation               | Phase taxonomy cũ không phủ 237 parity requirement         |
| `56_PARALLEL_AGENT_STRATEGY.md`             | Merge rules còn dùng; cập nhật single-owner và task schema | Nội dung đúng nhưng thiếu state/evidence contract mới      |
| `58_PROJECT_CHECKLIST.md`                   | Regenerate từ parity ledger                                | Checkbox hiện trộn code/docs claim/product parity          |
| `59_WORK_ITEM_INDEX.md`                     | Replace status model và ID scheme                          | Thiếu Needs Planning/In Review/Verified/Changes Requested  |
| `61_PHASE_HANDOFF_TEMPLATE.md`              | Replace bằng template mới                                  | Thiếu clean-checkout evidence và approvals                 |
| `63_IMPLEMENTATION_START_SEQUENCE.md`       | Archive                                                    | Sequence foundation đã qua; không phản ánh source hiện tại |
| `docs/batches/upcoming/74–82`               | Map vào STEP-08..11; không coi là toàn roadmap             | Bỏ sót workspace/setup/I/O/hardening và IDs mới            |

## 3. Cấu trúc đề xuất trong repository

```text
docs/
  plans/active/SPINE_PARITY_PLAN.md
  execution/
    00_INDEX.md
    01_MASTER_EXECUTION_ROADMAP.md
    02_AI_AGENT_OPERATING_GUIDE.md
    03_GIT_STATUS_AND_REPORTING_PROTOCOL.md
    04_TRACKING_MODEL.md
    steps/
    templates/
    schemas/
  tasks/
    backlog/
    ready/
    active/
    review/
    completed/
  evidence/
    builds/
    tests/
    e2e/
    performance/
    compatibility/
```

## 4. Migration sequence

1. Merge execution docs without xóa docs cũ.
2. Thêm banner `Superseded for 4.3 parity` vào docs cũ có conflict.
3. Sinh parity ledger và tracker từ STEP-01.
4. Reconcile batches/checklists: evidence thật được link; claim thiếu test hạ state.
5. Chuyển task active hợp lệ sang ID mới; không tự đóng task chỉ vì batch cũ `[x]`.
6. CI validate links, schemas, duplicate IDs và completion formula.
7. Sau một milestone, archive docs cũ đã không còn inbound links.

## 5. Quy tắc bảo toàn lịch sử

- Không rewrite completed batch để làm như thể requirement mới đã hoàn thành.
- Giữ commit/history/evidence cũ; bổ sung mapping sang requirement mới.
- Nếu code có nhưng UI chưa productized, state đúng là foundation/lab/partial.
- Nếu docs nói có nhưng test/build không xác minh được, state `unverified`.
