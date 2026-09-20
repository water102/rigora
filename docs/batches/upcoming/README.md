# Upcoming Batches Roadmap

Kế hoạch chi tiết cho các Batch tiếp theo nhằm đạt mục tiêu **Spine 2D Professional Parity** (theo [Spine Parity Plan](../../plans/active/SPINE_PARITY_PLAN.md)).

---

## Bối cảnh hiện tại

- **Đã hoàn thành (Batches 7–73)**:
  - Canonical Model, Invariants & Validation (`@rigora/model`).
  - Runtime Transform, Linear Blend Skinning (LBS), Constraints (IK, Path) & Physics (`@rigora/runtime`).
  - Adapters: Spine 3.8, Spine 4.2, DragonBones 5.5 / 6.0 (`@rigora/format-*`).
  - PixiJS 8 Dynamic Renderers (`@rigora/renderer-pixi`).
  - Studio Authoring & Mesh/Weights Tools (CDT triangulation, BBW Laplacian weights, soft brush, lasso, retriangulation, topology edits).
  - Framework-agnostic Command Bus & History (`@rigora/editor-core`).
  - Native Project Container (`.hbone` / `@rigora/project`).

- **Trọng tâm tiếp theo (Upcoming Phase)**:
  - Đưa khả năng diễn hoạt (Animation Authoring) từ code/JSON lên **Editor UI hoàn chỉnh**.
  - Xây dựng **Dopesheet & Timeline View** và **Graph Curve Editor**.

---

## Danh mục Batch tiếp theo (Theo thứ tự ưu tiên)

### Giai đoạn 1: Timeline & Dopesheet Workflow

| Batch                                          | Tên                                 | Trọng tâm                                                                                                   | Trạng thái           |
| :--------------------------------------------- | :---------------------------------- | :---------------------------------------------------------------------------------------------------------- | :------------------- |
| [**Batch 74**](batch-74-timeline-dopesheet.md) | **Timeline & Dopesheet Core**       | Data model cho tracks, rows, keyframe selection và đồng bộ playback clock                                   | `Ready for Planning` |
| **Batch 75**                                   | **Dopesheet UI & Keyframe Editing** | Thanh track dopesheet, kéo thả di chuyển keyframe, snap frame, copy/paste, loop range                       | `Backlog`            |
| **Batch 76**                                   | **Animation Channel Keying**        | Nút bấm Auto-Key, tạo keyframe cho bone transform (translate, rotate, scale), slot attachment và draw order | `Backlog`            |

---

### Giai đoạn 2: Graph Curve Editor

| Batch        | Tên                       | Trọng tâm                                                                             | Trạng thái |
| :----------- | :------------------------ | :------------------------------------------------------------------------------------ | :--------- |
| **Batch 77** | **Graph Editor Canvas**   | Hiển thị đường cong Bezier cho từng channel, zoom/pan viewport đồ thị                 | `Backlog`  |
| **Batch 78** | **Graph Tangent Editing** | Điều chỉnh Bezier handles, chế độ khóa tiếp tuyến (Split, Flat, Free), easing presets | `Backlog`  |

---

### Giai đoạn 3: Rigs & Constraints UI

| Batch        | Tên                         | Trọng tâm                                                                                     | Trạng thái |
| :----------- | :-------------------------- | :-------------------------------------------------------------------------------------------- | :--------- |
| **Batch 79** | **Constraint Authoring UI** | Thêm/sửa IK Constraint, Path Constraint, target bones và mix slider ngay trên Canvas UI       | `Backlog`  |
| **Batch 80** | **Physics Authoring UI**    | Chỉnh thông số vật lý (gravity, wind, damping, mass) và preview/baking trực tiếp trong editor | `Backlog`  |

---

### Giai đoạn 4: Production Polish

| Batch        | Tên                            | Trọng tâm                                                                                  | Trạng thái |
| :----------- | :----------------------------- | :----------------------------------------------------------------------------------------- | :--------- |
| **Batch 81** | **Multi-Skin Management UI**   | Quản lý Skins, gán skin placeholder attachments, preview đổi skin không nhân bản animation | `Backlog`  |
| **Batch 82** | **Animation Mixing & Preview** | UI phát nhiều animation tracks song song, crossfade mixing và preview kiểm thử             | `Backlog`  |
