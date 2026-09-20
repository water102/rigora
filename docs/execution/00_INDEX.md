# Rigora AI Execution Pack

> Baseline: [`../plans/active/SPINE_PARITY_PLAN.md`](../plans/active/SPINE_PARITY_PLAN.md), target Spine 4.3.26 stable  
> Dùng cho: AI coding agent, reviewer agent, maintainer và release owner  
> Mục tiêu: biến 237 parity requirement thành công việc có thể giao, kiểm chứng, commit và bàn giao; 7 `VS-*` là acceptance scenario riêng

## 1. Thứ tự ưu tiên tài liệu

Khi tài liệu mâu thuẫn, dùng thứ tự sau:

1. `../plans/active/SPINE_PARITY_PLAN.md` — scope và acceptance cuối cùng.
2. `01_MASTER_EXECUTION_ROADMAP.md` — dependency, step và release gate.
3. `steps/STEP-xx-*.md` — kế hoạch triển khai của từng bước.
4. `02_AI_AGENT_OPERATING_GUIDE.md` — cách agent thực hiện công việc.
5. `03_GIT_STATUS_AND_REPORTING_PROTOCOL.md` — commit, trạng thái và báo cáo.
6. Contract/architecture/algorithm hiện hành trong repository.
7. Task packet cụ thể trong `docs/tasks/active/`.

Không dùng các phase/batch cũ để giảm scope trong parity plan. Một batch cũ được
đánh dấu hoàn thành chỉ là bằng chứng tham khảo; requirement vẫn phải qua gate
product UI, runtime, I/O và test hiện hành.

## 2. Cấu trúc bộ tài liệu

- `01_MASTER_EXECUTION_ROADMAP.md`: thứ tự 16 bước, dependency và milestone.
- `02_AI_AGENT_OPERATING_GUIDE.md`: vòng đời công việc chuẩn của agent.
- `03_GIT_STATUS_AND_REPORTING_PROTOCOL.md`: nhánh, commit, cập nhật trạng thái,
  review và báo cáo.
- `04_TRACKING_MODEL.md`: state machine, ledger và quy tắc Complete.
- `05_REPOSITORY_DOCS_MIGRATION.md`: cách thay roadmap/batch cũ mà vẫn giữ lịch sử.
- `06_READY_TO_USE_AGENT_PROMPT.md`: prompt giao việc và prompt reviewer dùng ngay.
- `07_BOOTSTRAP_ASSIGNMENT_QUEUE.md`: queue task đầu tiên cho STEP-00..02.
- `08_LIBRARY_ADOPTION_MATRIX.md`: nghiên cứu thư viện bổ trợ, quyết định
  Keep/Adopt/PoC/Build và gate thêm dependency theo từng nhóm requirement.
- `dependency-decisions.json`: registry machine-readable để agent/CI tra cứu
  quyết định, owner step, license và điều kiện chấp nhận dependency.
- `requirement-counts.json`: manifest số lượng ID được CI đối chiếu trực tiếp
  với parity plan; thay đổi scope phải cập nhật manifest trong cùng commit.
- `steps/`: một plan lớn cho mỗi bước; mỗi plan có các subplan có thể giao riêng.
- `templates/`: task packet, implementation plan, completion report, handoff, ADR.
- `schemas/`: schema machine-readable cho task và parity ledger.

## 3. Agent bắt đầu ở đâu

1. Đọc file này, master parity plan, roadmap và step đang active.
2. Chọn đúng một subplan có trạng thái `Ready`.
3. Tạo task packet từ `templates/01_TASK_PACKET_TEMPLATE.md`.
4. Chạy preflight và ghi baseline trước khi sửa code.
5. Implement theo vertical slice nhỏ; test theo từng commit boundary.
6. Commit theo protocol; không tự đánh dấu `Complete` chỉ vì build xanh.
7. Cập nhật task, ledger tám lớp, step checklist và completion report.
8. Reviewer xác minh evidence rồi mới chuyển `Verified`/`Done`.

## 4. Quy tắc cốt lõi

- Functional parity là bắt buộc; UI/hotkey/icon/text có thể replicate, adapt hoặc
  equivalent theo provenance policy.
- Mọi mutation persistent phải qua command transaction và có undo/redo.
- Product UI không được gọi là hoàn thành nếu capability chỉ tồn tại trong lab.
- Không silent-loss khi import/export; mọi convert/bake/drop/block phải hiện rõ.
- Editor preview, runtime validator và exported runtime dùng cùng semantics.
- Không sửa fixture chỉ để làm test xanh nếu chưa chứng minh fixture sai.
- Mọi thay đổi single-owner/high-risk cần lock hoặc review kiến trúc trước.

## 5. Kết quả cuối cùng

Program chỉ hoàn thành khi toàn bộ 237 parity requirement là `Complete` và
`Verified`, hoặc có exception được phê duyệt với owner, lý do, ảnh hưởng và kế
hoạch xử lý. Không được gộp `Model`, `Runtime`, `Lab` hoặc `Product UI` thành một
trạng thái `Done` duy nhất.
