# STEP-00 — Baseline and Reproducibility

## Outcome

Tạo một baseline có thể checkout, build, test và audit lặp lại. Mọi claim “đã có”
trong batches/docs phải được liên kết tới code/test chạy được; không sửa feature.

## Preconditions

- Có snapshot source đầy đủ và quyền chạy scripts hiện có.
- Xác định package manager, runtime version, OS support và CI hiện hành.

## Ownership

- Toàn workspace ở chế độ audit; chỉ sửa build/test/config/docs cần thiết.
- Root config và lockfile là single-owner.

## Subplans

### P01 — Repository inventory

- Lập inventory apps/packages/docs/tests/fixtures/build outputs.
- Ghi package dependency graph và phát hiện cycle/private boundary violation.
- So sánh docs claim với symbol/test/product UI; gắn `verified` hoặc `unverified`.

### P02 — Reproducible toolchain

- Pin/document Node/package-manager/tool versions từ source of truth.
- Chuẩn hóa install, typecheck, unit, integration, E2E và build commands.
- Không “fix” lockfile hàng loạt nếu chưa có task riêng.

### P03 — Clean baseline

- Chạy toàn bộ checks trên clean checkout.
- Phân loại failure: environment, flaky, known product defect, missing fixture.
- Tạo baseline report gồm thời gian, test count và artifact location.

### P04 — Existing-state audit

- Tách `product`, `foundation`, `lab`, `runtime`, `docs-only` cho từng package.
- Reconcile batches 7–82 và project checklist với evidence thật.
- Không đổi parity requirement thành Complete ở bước này.

### P05 — CI evidence shell

- Tạo nơi chứa machine-readable test/build/performance reports.
- Thêm check duplicate IDs, broken internal links và JSON Schema validation.

## Suggested tasks

- `S00-P01-T01` workspace/package inventory.
- `S00-P02-T01` reproducible command matrix.
- `S00-P03-T01` baseline test report.
- `S00-P04-T01` docs-versus-code discrepancy ledger.
- `S00-P05-T01` CI evidence and schema checks.

## Gate

- Một agent mới có thể checkout và chạy cùng commands với kết quả giải thích được.
- Không còn package/test/fixture quan trọng chưa inventory.
- Mọi baseline failure có defect ID, owner và mức ảnh hưởng.
- Không có thay đổi feature hoặc scope ẩn trong “setup”.

## Handoff evidence

- Dependency graph, command matrix, baseline report, discrepancy ledger, CI logs.
