# AI Agent Operating Guide

## 1. Nhiệm vụ của agent

Agent triển khai đúng một task packet đã `Ready`, tạo thay đổi nhỏ có thể review,
chứng minh acceptance bằng test/evidence, commit có chủ đích, cập nhật tracker và
bàn giao trung thực. Agent không được tự tuyên bố parity cho toàn feature khi chỉ
hoàn thành một lớp kỹ thuật.

## 2. Tài liệu phải đọc trước khi code

1. `AGENTS.md` gần nhất và root repository instructions.
2. `../plans/active/SPINE_PARITY_PLAN.md` và requirement ID được giao.
3. `01_MASTER_EXECUTION_ROADMAP.md` và step plan tương ứng.
4. `08_LIBRARY_ADOPTION_MATRIX.md` và `dependency-decisions.json` nếu task dùng,
   thêm, thay hoặc loại dependency.
5. Contract/architecture/algorithm được task packet chỉ định.
6. Existing tests, fixtures, completed batches và current implementation.
7. `03_GIT_STATUS_AND_REPORTING_PROTOCOL.md`.

Nếu task packet không chỉ rõ requirement ID, owner, package, fixture, acceptance
và forbidden changes, agent dừng ở trạng thái `Needs Planning`.

## 3. Vòng đời chuẩn

### 3.1 Preflight

- Ghi branch/commit hiện tại và `git status --short`.
- Không sửa/xóa thay đổi có sẵn của người dùng hoặc agent khác.
- Xác định package manager và scripts từ repository; không đoán lệnh.
- Chạy test tối thiểu của vùng sẽ sửa và ghi baseline pass/fail.
- Tìm implementation gần nhất bằng `rg`; phân biệt product, lab và docs claim.
- Kiểm tra task dependency đã `Verified`, không chỉ `Done` trong batch cũ.
- Nếu cần package mới, xác nhận trạng thái adoption, license, adapter, fixture,
  benchmark và rollback path theo `08_LIBRARY_ADOPTION_MATRIX.md`; không cài trước
  khi các mục này có trong implementation plan.

### 3.2 Lập implementation plan

Plan phải nêu:

- file/module dự kiến sửa và public API;
- invariant/semantics phải giữ;
- transaction/undo boundary;
- fixtures và oracle;
- targeted test → package test → integration/E2E;
- commit boundary;
- rủi ro, non-goal và stop condition.

Nếu task vượt 8 point, chạm hơn hai high-risk boundary hoặc cần đổi frozen
contract, tách task/ADR trước khi code.

### 3.3 Implement

- Contract và test observable behavior trước UI polish.
- Persistent mutation luôn đi qua Command; một gesture/stroke là một undo step.
- Không để React/Pixi/source-format object rò vào canonical model.
- Không dùng `any`, silent catch, magic fallback hoặc silent data drop.
- Worker/background job phải có progress, cancellation và deterministic result.
- Dùng cùng evaluator/runtime semantics giữa editor preview, validator và export.
- UI phải phủ loading/empty/error/disabled/mixed/focus/keyboard/undo states.
- Import/export phải chạy preflight capability scan trước khi ghi dữ liệu.

### 3.4 Verify

Chạy theo thứ tự, dừng và sửa tại tầng fail đầu tiên:

1. Test mới/targeted test.
2. Typecheck/lint package.
3. Unit/property/golden fixtures liên quan.
4. Integration giữa package.
5. Browser/E2E workflow nếu có UI.
6. Build production.
7. Performance/visual/security test khi task chạm hot path hoặc file boundary.

Không ghi “all tests pass” nếu không liệt kê chính xác command và result.

### 3.5 Self-review

- Đọc `git diff` toàn bộ; tìm accidental changes, debug logs, TODO vô chủ.
- Chạy `git diff --check`.
- Kiểm tra API/serialization compatibility và migration.
- Kiểm tra diagnostics có actionable entity/path và không lộ dữ liệu nhạy cảm.
- Kiểm tra test thật sự fail trước fix hoặc chứng minh fixture/oracle độc lập.

### 3.6 Commit, tracker và report

Tuân theo protocol riêng. Commit không đồng nghĩa requirement `Complete`.
Agent chỉ chuyển task sang `In Review`; reviewer/owner mới chuyển `Verified` và
step owner mới đóng gate.

## 4. Invariant theo loại công việc

### Model/runtime

- ID/reference ổn định; deterministic ordering; finite-number guards.
- Coordinate, transform, color, time và path conventions không tự thay đổi.
- Evaluation order explicit; không nhét version switch vào renderer.

### Editor/UI

- Selection sync giữa Tree/Stage/Inspector/Dopesheet/Graph/Weights.
- State persistent và ephemeral tách biệt.
- Keyboard, focus, context menu, tooltips và accessibility cơ bản có test.
- UI clone gần Spine được phép, nhưng visual similarity không thay thế behavior.

### Import/export

- Source AST → validate → normalize → canonical; reverse qua capability planner.
- Unknown/unsupported data: preserve, convert, bake, drop-with-consent hoặc block.
- Output vào temp rồi atomic replace; cancel không để file giả hoàn chỉnh.

### Algorithms

- Ghi provenance/license và numeric tolerance.
- Thuật toán tương đương được chấp nhận nếu oracle observable pass.
- Không sao chép code/asset không có quyền; không decompile trái quyền.

## 5. Stop conditions bắt buộc

Dừng và báo `Blocked` khi:

- spec/fixture/runtime oracle mâu thuẫn;
- cần đổi frozen contract, canonical schema hoặc evaluation order;
- dependency/license/provenance chưa rõ;
- baseline test fail do nguyên nhân ngoài task;
- workspace có thay đổi chồng lấn không thể bảo toàn;
- acceptance chỉ có thể đạt bằng silent loss hoặc hard-coded fixture;
- numeric và visual oracle cho kết quả trái nhau;
- quyền/credential hoặc external coordination vượt scope được giao.

## 6. Reviewer checklist

Reviewer xác minh độc lập:

- task scope và requirement mapping;
- boundary/architecture;
- test quality và regression value;
- undo/cancel/save/reopen;
- compatibility/provenance/diagnostics;
- performance và UI workflow evidence;
- report khớp diff và commit.

Reviewer trả `Changes Requested` kèm defect ID; không sửa hộ trong cùng review.
