# Batch 74 — Timeline & Dopesheet Engine

> **Trạng thái:** `Ready for Planning`  
> **Tham chiếu lộ trình:** [Upcoming Batches Roadmap](README.md) & [Spine Parity Plan](../../plans/active/SPINE_PARITY_PLAN.md) (Batch 5)

---

## 1. Mục tiêu

Xây dựng mô hình dữ liệu (Data & Query Model) và Command Suite cho Dopesheet / Timeline, kết nối giữa `@rigora/model` (Canonical Animation Timelines) và giao diện người dùng `apps/editor-shell`.

Người dùng có thể truy vấn, duyệt keyframe theo frame/time, chọn (single/multi-select) keyframe, và thao tác di chuyển/xóa keyframe thông qua Command Bus hoàn toàn có thể Undo/Redo.

---

## 2. Phạm vi thực hiện

### 1. Dopesheet Model (`@rigora/editor-core` hoặc `@rigora/timeline-model`)

- Biểu diễn phân cấp Track / Row:
  - Root: Skeleton
    - Bone Rows (Rotate, Translate, Scale, Shear)
    - Slot Rows (Attachment switch, Color tint)
    - Deform Rows (Mesh vertex offset)
    - Constraint Rows (IK mix, Path position/spacing/mix)
    - Event Row
- Keyframe Indexing:
  - Cung cấp query hiệu quả $O(\log N)$ để tìm các keyframe trong khoảng thời gian $[t_{start}, t_{end}]$ phục vụ vẽ dopesheet.
  - Hỗ trợ snap to frame (ví dụ 24 FPS, 30 FPS, 60 FPS) hoặc unconstrained time.

### 2. Selection & Clipboard Model

- Lưu trạng thái lựa chọn keyframe: `Set<KeyframeId>`.
- Khả năng chọn cả hàng (row selection) hoặc chọn vùng (box select keyframes).
- Thao tác clipboard: Copy / Paste / Duplicate keyframes.

### 3. Symmetric Commands

- `MoveKeyframesCommand`: Di chuyển một tập hợp keyframe sang mốc thời gian mới kèm delta $dt$.
- `DeleteKeyframesCommand`: Xóa các keyframe đã chọn và khôi phục lại khi undo.
- `ScaleKeyframesCommand`: Co giãn khoảng cách giữa các keyframe xung quanh mốc pivot.

---

## 3. Tiêu chí nghiệm thu (Definition of Done)

1. Unit test bao phủ 100% logic:
   - Truy vấn keyframe theo range thời gian.
   - Thao tác di chuyển keyframe không làm đảo lộn thứ tự thời gian.
   - Undo/Redo khôi phục chính xác trạng thái animation ban đầu.
2. Kiểm tra `pnpm check` đạt 100% không cảnh báo.
