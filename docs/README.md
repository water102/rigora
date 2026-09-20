# Rigora Documentation Index

Tài liệu kỹ thuật và nhật ký triển khai của dự án **Rigora** (2D Skeletal Animation Engine & Editor).

---

## Cấu trúc thư mục tài liệu

```text
docs/
├── batches/      # Nhật ký triển khai chi tiết theo từng Batch (Batch 7 -> Batch 73)
├── contracts/    # Hợp đồng kỹ thuật (API & semantic contracts) của các package
├── plans/        # Kế hoạch mở rộng, addendum và lộ trình tương thích
├── release/      # Kết quả kiểm định bảo mật, parser mutation, SBOM và checklist
└── README.md     # Mục lục này
```

---

## 1. Hợp đồng kỹ thuật ([`contracts/`](contracts/))

Các tài liệu định nghĩa giao thức, semantic và ranh giới xử lý của từng module:

- [Animation Contract](contracts/animation-contract.md): Hợp đồng lấy mẫu timeline, nội suy Bézier, quản lý clock và phát sự kiện trong `@rigora/animation`.
- [Transform Contract](contracts/transform-contract.md): Ma trận phân cấp xương, quy ước toạ độ Y-up sang Pixi Y-down, thứ tự giải ràng buộc IK và biến dạng lưới.
- [Import Contract](contracts/import-contract.md): Nhận diện phiên bản Spine 3.8 / DragonBones 5.5 / 6.0 và xử lý chẩn đoán giao dịch.
- [Renderer Contract](contracts/renderer-contract.md): Pipeline hiển thị PixiJS 8 (Region Sprite và Mesh Skinned với buffer động không cấp phát per-frame).

---

## 2. Kế hoạch & Addendum ([`plans/`](plans/))

- [Spine Parity Plan](plans/SPINE_PARITY_PLAN.md): Chiến lược và ma trận đối chuẩn tương thích 100% tính năng Spine 3.8 / 4.2.
- [LoongBones Engineering Addendum](plans/loongbones-spec-addendum.md): Nghiên cứu kiến trúc LoongBones Web v1.2.3, tích hợp BBW (Bounded Biharmonic Weights), Constrained Delaunay Triangulation và nhận diện DragonBones 6.0.
- [Spine 4.2 Physics Plan](plans/phase-8-spine42-physics.md): Lộ trình mở rộng mô phỏng vật lý mềm và lò xo theo chuẩn Spine 4.2.

---

## 3. Nhật ký thực thi Batch ([`batches/`](batches/))

Lịch sử triển khai từ các batch nền tảng runtime đến các batch công cụ authoring nâng cao:

- **Mesh & Rendering cơ sở**: [Batch 7 (Mesh & DB6)](batches/batch-7-mesh-db60.md) | [Batch 9 (Mesh Renderer)](batches/batch-9-mesh-renderer.md) | [Batch 10 (Mesh Authoring)](batches/batch-10-mesh-authoring.md)
- **Constraint Runtime**: [Batch 12 (IK Constraints)](batches/batch-12-constraint-runtime.md) | [Batch 13 (Path Constraints)](batches/batch-13-path-constraint-runtime.md)
- **Editor Shell & Foundation**: [Batch 14 (Native Project)](batches/batch-14-native-project.md) | [Batch 15 (Command History)](batches/batch-15-command-history.md) | [Batch 24 (Editor Shell)](batches/batch-24-editor-shell.md)
- **Authoring & Brush Tools**: [Batch 34](batches/batch-34-lasso-soft-brush.md) $\to$ [Batch 73 (Brush Replace)](batches/batch-73-brush-replace.md)

---

## 4. Kiểm định & Phát hành ([`release/`](release/))

- [Package Qualification](release/PACKAGE_QUALIFICATION.md)
- [Install Qualification](release/INSTALL_QUALIFICATION.md)
- [Release Gate Checklist](release/RELEASE_GATE_CHECKLIST.md)
- SBOM & Third Party Notices: Được sinh tự động bởi `tools/generate-release-metadata.mjs`.

---

## Mối quan hệ với thư mục [`spec/`](../spec/)

- Thư mục [`spec/`](../spec/) ở root dự án là **HNN Bones — Technical Specification Pack** nguyên bản (đặc tả clean-room chuẩn, có [spec/CHECKSUMS.sha256](../spec/CHECKSUMS.sha256) và [spec/MANIFEST.md](../spec/MANIFEST.md)).
- Thư mục `docs/` là tài liệu vận hành và nhật ký hiện thực hoá của dự án Rigora dựa trên bộ spec nền tảng đó.
