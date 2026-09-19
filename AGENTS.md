# AGENTS.md — Rigora Engineering Guidelines

## Git Workflow Rule

- **Với mỗi Batch (hoặc tính năng chính) hoàn thành, phải commit Git 1 lần**.
- Trước khi commit, phải đảm bảo chạy kiểm tra tự động `pnpm check` (hoặc `pnpm test && pnpm build`) đạt 100% không lỗi.
- Thông điệp commit phải chuẩn hoá rõ ràng theo Conventional Commits (ví dụ: `feat: implement Batch 10 ...`).
