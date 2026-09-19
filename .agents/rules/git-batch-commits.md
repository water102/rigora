---
description: Quy định commit Git sau mỗi batch
---

# Quy tắc commit Git theo từng Batch

Với mỗi Batch hoàn thành trong lộ trình dự án (hoặc sau mỗi tính năng lớn hoàn tất):

1. **Kiểm tra tự động trước khi commit**: Chạy `pnpm check` (hoặc `pnpm typecheck && pnpm lint && pnpm test && pnpm build`) đảm bảo 100% không có lỗi type, lint, format hoặc test fail.
2. **Commit Git 1 lần duy nhất cho mỗi batch**:
   - Sử dụng `git add .` và `git commit -m "feat: ..."` với thông điệp rõ ràng, nêu bật các chức năng/gói được tạo mới hoặc nâng cấp trong batch.
   - Không gộp nhiều batch vào một commit.
   - Không bỏ dở giữa chừng khi batch chưa được commit vào Git local.
