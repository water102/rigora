# Rigora Documentation Index & Status Matrix

Tài liệu kỹ thuật, đặc tả kiến trúc và nhật ký triển khai của dự án **Rigora** (2D Skeletal Animation Engine & Editor).

---

## Bảng trạng thái tiến độ (Status Matrix Dashboard)

| Hạng mục / Module        | Thành phần chi tiết                                                 | Trạng thái             | Tài liệu đối chiếu                                                                                     |
| :----------------------- | :------------------------------------------------------------------ | :--------------------- | :----------------------------------------------------------------------------------------------------- |
| **Foundational Model**   | Canonical skeletal schema, Invariants validation, Error codes       | **HOÀN THÀNH**         | [`contracts/transform-contract.md`](contracts/transform-contract.md)                                   |
| **Runtime Transforms**   | 2D Bone hierarchy, FK evaluation, Y-up $\to$ Y-down conversion      | **HOÀN THÀNH**         | [`contracts/transform-contract.md`](contracts/transform-contract.md)                                   |
| **Skinned Mesh Deform**  | LBS CPU Skinning, Deform timelines, Dynamic buffer updates          | **HOÀN THÀNH**         | [`batches/completed/batch-9-mesh-renderer.md`](batches/completed/batch-9-mesh-renderer.md)             |
| **Constraint Runtime**   | Analytic 1/2-bone IK, Path constraint Bézier arc-length engine      | **HOÀN THÀNH**         | [`batches/completed/batch-12-constraint-runtime.md`](batches/completed/batch-12-constraint-runtime.md) |
| **Physics Simulation**   | Deterministic Euler `PhysicsWorld`, Physics bake/reset              | **HOÀN THÀNH**         | [`plans/completed/phase-8-spine42-physics.md`](plans/completed/phase-8-spine42-physics.md)             |
| **Import / Export**      | Spine 3.8, Spine 4.2 subset, DragonBones 5.5/6.0 recognition        | **HOÀN THÀNH**         | [`contracts/import-contract.md`](contracts/import-contract.md)                                         |
| **Authoring Tools**      | CDT mesh triangulation, BBW Laplacian weights, Lasso, Soft brush    | **HOÀN THÀNH**         | [`plans/completed/loongbones-spec-addendum.md`](plans/completed/loongbones-spec-addendum.md)           |
| **Editor Foundation**    | Framework-agnostic Command Bus, Native `.hbone` container, Dockview | **HOÀN THÀNH**         | [`batches/completed/batch-24-editor-shell.md`](batches/completed/batch-24-editor-shell.md)             |
| **Timeline & Dopesheet** | Query model, Keyframe selection, Dopesheet tracks & scrubber        | **KẾ HOẠCH TIẾP THEO** | [`batches/upcoming/batch-74-timeline-dopesheet.md`](batches/upcoming/batch-74-timeline-dopesheet.md)   |
| **Graph Curve Editor**   | Bézier curves, Tangent manipulation (Split/Flat), Easing presets    | **CHƯA LÀM (BACKLOG)** | [`plans/active/SPINE_PARITY_PLAN.md`](plans/active/SPINE_PARITY_PLAN.md) (Batch 6)                     |
| **Constraints & Rig UI** | Đặt IK target, vẽ Path curve trực tiếp trên Stage Canvas            | **CHƯA LÀM (BACKLOG)** | [`plans/active/SPINE_PARITY_PLAN.md`](plans/active/SPINE_PARITY_PLAN.md) (Batch 7)                     |
| **Multi-Track Mixing**   | Animation track mixing, Crossfade blending preview                  | **CHƯA LÀM (BACKLOG)** | [`plans/active/SPINE_PARITY_PLAN.md`](plans/active/SPINE_PARITY_PLAN.md) (Batch 8)                     |
| **Multi-Skin UI**        | Panel quản lý skins, gán attachments theo skin                      | **CHƯA LÀM (BACKLOG)** | [`plans/active/SPINE_PARITY_PLAN.md`](plans/active/SPINE_PARITY_PLAN.md) (Batch 3)                     |

---

## Cấu trúc thư mục tài liệu

```text
docs/
├── batches/                      # NHẬT KÝ & KẾ HOẠCH BATCH
│   ├── completed/                # [ĐÃ XONG] 66 file batch đã kiểm thử 100% (Batch 7 -> Batch 73)
│   └── upcoming/                 # [CHƯA LÀM / LỘ TRÌNH] Kế hoạch các batch tiếp theo (Batch 74+)
│
├── plans/                        # KẾ HOẠCH & LỘ TRÌNH CHIẾN LƯỢC
│   ├── active/                   # [ĐANG TIẾP DIỄN] Kế hoạch dài hạn (Spine Parity Plan)
│   └── completed/                # [ĐÃ XONG] Các bản addendum đã hiện thực hoá vào code
│
├── contracts/                    # HỢP ĐỒNG KỸ THUẬT ACTIVE (Giao tiếp module)
│   ├── animation-contract.md
│   ├── transform-contract.md
│   ├── import-contract.md
│   └── renderer-contract.md
│
├── execution/                    # ROADMAP & GIAO VIỆC CHO AI AGENT
│   ├── 00_INDEX.md               # Điểm vào và thứ tự đọc
│   ├── 01_MASTER_EXECUTION_ROADMAP.md
│   ├── 08_LIBRARY_ADOPTION_MATRIX.md
│   ├── steps/                    # STEP-00..15
│   ├── templates/                # Task/plan/report/handoff/ADR
│   └── schemas/                  # Task và parity-ledger schemas
│
├── spec/                         # BỘ ĐẶC TẢ KIẾN TRÚC GỐC (HNN Bones Spec Pack)
│   ├── README.md                 # Thứ tự đọc và chỉ dẫn 64 file kiến trúc
│   ├── docs/                     # 64 file đặc tả lý thuyết chuẩn, thuật toán, ADRs
│   ├── reference-models/         # Canonical schemas gốc (canonical-model, capabilities, diagnostic)
│   └── templates/                # Mẫu quy trình thực thi
│
├── release/                      # KẾT QUẢ KIỂM ĐỊNH & QUALIFICATION
│   ├── PACKAGE_QUALIFICATION.md
│   ├── INSTALL_QUALIFICATION.md
│   ├── RELEASE_GATE_CHECKLIST.md
│   └── SBOM.json
│
└── README.md                     # Bảng chỉ mục này
```

---

## 1. Kế hoạch & Lộ trình ([`plans/`](plans/))

- **Đang tiếp diễn / Chưa làm ([`plans/active/`](plans/active/))**:
  - [Spine Parity Plan](plans/active/SPINE_PARITY_PLAN.md): Lộ trình đối chuẩn 100% tính năng và quy trình làm việc với Spine 2D Professional.
- **Đã hoàn thành ([`plans/completed/`](plans/completed/))**:
  - [LoongBones Engineering Addendum](plans/completed/loongbones-spec-addendum.md): Tích hợp CDT meshing (`earcut`/`delaunator`), BBW Laplacian weights và nhận diện DragonBones 6.0.
  - [Spine 4.2 Physics Plan](plans/completed/phase-8-spine42-physics.md): Tích hợp mô phỏng vật lý lò xo semi-implicit Euler và bộ bake keyframes.

Roadmap triển khai hiện hành cho AI agent nằm tại
[`execution/00_INDEX.md`](execution/00_INDEX.md). Các phase/batch cũ là evidence
tham khảo; không được dùng để giảm scope của parity plan hiện hành.

---

## 2. Nhật ký & Kế hoạch Batch ([`batches/`](batches/))

- **Các Batch sắp tới ([`batches/upcoming/`](batches/upcoming/))**:
  - [Upcoming Batches Roadmap](batches/upcoming/README.md): Lộ trình thứ tự ưu tiên các batch tiếp theo.
  - [Batch 74: Timeline & Dopesheet Engine](batches/upcoming/batch-74-timeline-dopesheet.md): Phác thảo yêu cầu kỹ thuật và phạm vi cho batch kế tiếp.
- **Các Batch đã hoàn thành ([`batches/completed/`](batches/completed/))**:
  - Gồm 66 báo cáo thực thi từ [Batch 7 (Mesh & DB6)](batches/completed/batch-7-mesh-db60.md) đến [Batch 73 (Brush Replace)](batches/completed/batch-73-brush-replace.md).

---

## 3. Hợp đồng kỹ thuật ([`contracts/`](contracts/))

- [Animation Contract](contracts/animation-contract.md): Hợp đồng lấy mẫu timeline, nội suy Bézier, quản lý clock và phát sự kiện trong `@rigora/animation`.
- [Transform Contract](contracts/transform-contract.md): Ma trận phân cấp xương, quy ước toạ độ Y-up sang Pixi Y-down, thứ tự giải ràng buộc IK và biến dạng lưới.
- [Import Contract](contracts/import-contract.md): Nhận diện phiên bản Spine 3.8 / DragonBones 5.5 / 6.0 và xử lý chẩn đoán giao dịch.
- [Renderer Contract](contracts/renderer-contract.md): Pipeline hiển thị PixiJS 8 (Region Sprite và Mesh Skinned với buffer động không cấp phát per-frame).

---

## 4. Đặc tả kỹ thuật gốc ([`spec/`](spec/))

- [Spec README & Reading Order](spec/README.md): Danh mục 64 tài liệu kiến trúc, thuật toán, semantic và quy chuẩn clean-room.
- [Kiến trúc & Thuật toán](spec/docs/): 64 tài liệu chi tiết từ Product Scope, Transform Semantics, IK Solvers đến Mesh Geometry, Weight Algorithms và ADRs.
- [Reference Models](spec/reference-models/): Các canonical schemas tham chiếu gốc (`canonical-model.ts`, `capabilities.ts`, `diagnostic.ts`).

---

## 5. Kiểm định & Phát hành ([`release/`](release/))

- [Package Qualification](release/PACKAGE_QUALIFICATION.md)
- [Install Qualification](release/INSTALL_QUALIFICATION.md)
- [Release Gate Checklist](release/RELEASE_GATE_CHECKLIST.md)
- SBOM & Third Party Notices: Được sinh tự động bởi `tools/generate-release-metadata.mjs`.
