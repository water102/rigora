# Báo Cáo Điều Tra Hệ Thống LoongBones Web & Định Hướng Ứng Dụng Cho Dự Án Rigora

> **Thời gian thực hiện**: 19/09/2026  
> **Mục tiêu**: Điều tra toàn diện công nghệ của LoongBones App (`https://www.loongbones.app`), thu thập toàn bộ tài nguyên cốt lõi về local (`research/loongapp/raw`) và xây dựng chiến lược ứng dụng cho dự án Rigora.

---

## 1. Tổng Quan Về LoongBones Web (loongapp)

LoongBones Web là giải pháp hiện đại hóa hoàn chỉnh trên nền tảng Web của công cụ **DragonBones Pro** (phần mềm hoạt họa 2D khung xương nổi tiếng). Hệ thống cung cấp một Animation Studio hoàn chỉnh chạy trực tiếp trên trình duyệt với khả năng:
- Rigging & Weight painting (gắn xương, phân bổ trọng số lưới).
- Mesh Deformation (biến dạng lưới đa giác FFD).
- Ràng buộc động lực học & hình học (IK, Transform, Path, Physics simulation với gió và trọng lực).
- Animation Timeline & Dopesheet (hỗ trợ Bézier curves, Animation Proxy / Blending kiểu Spine 4.3).
- Trợ lý ảo AI Agent tích hợp (điều khiển phần mềm và sinh animation qua câu lệnh tự nhiên).
- Đa định dạng xuất nhập: DragonBones JSON (`_ske.json`), DragonBones Binary (`.dbbin`), DragonBones Project (`.dbproj`), tương thích Spine 3.8 đến 4.2, GIF, Video MP4, và ZIP ảnh tuần tự.

---

## 2. Chi Tiết Stack Công Nghệ (Tech Stack Analysis)

### 2.1. Phân Tầng Ứng Dụng (Application Layering)
Hệ thống phân tách thành hai phân hệ rõ rệt:

1. **Phân hệ Auth & Dashboard (Portal)**:
   - **Framework**: Vue 3 (`npm.vue.66570ced.js`).
   - **UI Library**: Ant Design Vue (`npm.ant-design-vue.5c117164.js`).
   - **Styling**: Tailwind CSS (`tailwindcss.js`) kết hợp Vanilla CSS modules.
   - **Tiện ích**: `html2canvas` (chụp preview tác phẩm), Cloudflare Insights.

2. **Phân hệ Animation Studio (Core Editor)**:
   - **Framework**: **React 18+** (sử dụng React Fiber architecture).
   - **UI Library**: **Ant Design React** (Inputs, Sliders, Dropdowns, Tabs, Collapses, Modals).
   - **Window & Docking System**: **GBoxLayout** (`editor/libs/gboxlayout.js`, `gboxlayout.css`): Engine quản lý dockable/resizable panel do đội ngũ phát triển xây dựng (`GNode`, `GBox`, `GSplit`, `GPanel`), hỗ trợ kéo thả dock tab, chia tỉ lệ màn hình linh hoạt.
   - **Mô hình Kiến trúc**: **GMVC** (`editor/libs/gmvc.js`):
     - **Command Pattern**: `CommandManager`, `QueueCommand` – Mọi thao tác biên tập (tạo xương, dịch chuyển đỉnh lưới, thêm keyframe) đều được đóng gói thành Command đối xứng (`execute` và `undo`).
     - **Lịch sử đa tầng**: `GHistory` / `HistoryController` xử lý Undo/Redo an toàn dữ liệu.
     - **Quản lý Trạng thái**: `GStore` (Single Source of Truth cho toàn bộ cây phân cấp armature).
     - **Phím tắt**: `ShortcutController` (chuẩn hóa phím tắt Photoshop / Spine / DragonBones).

---

### 2.2. Lõi Đồ Họa & Thuật Toán Hoạt Họa (Graphics & Animation Core)

| Thành phần | Thư viện / File | Chức năng & Bản chất thuật toán |
| :--- | :--- | :--- |
| **Animation Engine** | `editor/libs/dragonBones/dragonBones.js` | DragonBones JS Engine v6.0.001 / v6.0.2 (tương thích PixiJS 7/8). Quản lý cấu trúc dữ liệu: `ArmatureData`, `BoneData`, `SlotData`, `SkinData`, `GeometryData`, `MeshDisplayData`, `WeightData`. |
| **Render Pipeline** | HTML5 `<canvas>` + WebGL 2.0 | Tăng tốc phần cứng qua ANGLE Direct3D11 / OpenGL ES 3.0. Xử lý dynamic vertex buffer (`gl.bufferSubData`) cho lưới biến dạng (Deformable Mesh). |
| **Mesh Triangulation** | `editor/libs/triangle.js` | Thuật toán **2D Delaunay Triangulation** để biến ảnh sprite 2D viền trong suốt thành lưới đa giác (polygon mesh) tối ưu số lượng đỉnh. |
| **Đại số tuyến tính** | `editor/libs/numeric-1.2.6.min.js` | Bộ giải ma trận và hệ phương trình tuyến tính thưa (sparse linear system solver) phục vụ tính toán biến dạng hình học 2D. |
| **Tự động tính Trọng số (Skinning)** | `editor/libs/bbw.js` | Thuật toán **BBW (Bounded Biharmonic Weights)** kết hợp **LBS (Linear Blend Skinning)** (`laplacian_and_mass_matrices`, `linear_blend_skin_2D`). Đây là thuật toán hàng đầu trong đồ họa máy tính (Blender, Spine) giúp tính toán trọng số mượt mà giữa các xương vào từng đỉnh mesh mà không bị gãy góc hay co rúm. |
| **Serialization** | `editor/libs/amf.js` | Action Message Format parser & encoder, hỗ trợ đọc ghi dữ liệu nhị phân tốc độ cao. |

---

### 2.3. Các Subsystem Nâng Cao Của LoongBones

1. **Constraints Engine (Bộ giải ràng buộc)**:
   - **IK Constraint**: Giải nghịch đảo động học 2 khớp (2-bone IK solver) cho chân, tay nhân vật.
   - **Transform Constraint**: Sao chép / chia sẻ tỉ lệ transform giữa các xương.
   - **Path Constraint**: Ép xương hoặc mesh di chuyển/uốn lượn dọc theo đường cong Bézier (Bezier path).
   - **Physics Constraint & Wind**: Mô phỏng vật lý mềm (tóc, váy, phụ kiện đung đưa theo trọng lực, lực cản và gió), hỗ trợ tính năng **Physics Baking** (nướng chuyển động vật lý thành keyframe).
2. **Animation Proxy & Blending**:
   - Hòa trộn mượt mà nhiều clip hoạt họa đồng thời (tương tự animation slider trong Spine 4.3).
3. **AI Copilot Agent**:
   - Tích hợp mô hình ngôn ngữ lớn (LLM) để tương tác qua chat: tự động tạo xương, tạo slot, thêm ràng buộc, chỉnh playhead và chèn keyframes.

---

## 3. Danh Mục Tài Nguyên Đã Tải Về (`research/loongapp/raw`)

Toàn bộ **86 tệp tài nguyên** (~18.5 MB) của LoongBones Web đã được tải về cục bộ với cấu trúc chuẩn:

```text
research/loongapp/raw/
├── editor/
│   ├── index.html                           # Full HTML entry point của Studio
│   ├── manifest.json
│   ├── libs/
│   │   ├── dragonBones/dragonBones.js       # DragonBones v6 Core Engine (783 KB)
│   │   ├── gmvc.js                          # Kiến trúc Command & Store của Editor (82 KB)
│   │   ├── gboxlayout.js & .css             # Docking panel system (67 KB)
│   │   ├── bbw.js                           # Bounded Biharmonic Weights skinning (8.7 KB)
│   │   ├── triangle.js                      # 2D Delaunay mesh triangulation (18.5 KB)
│   │   ├── numeric-1.2.6.min.js             # Linear algebra solver (71 KB)
│   │   ├── amf.js                           # Action Message Format binary codec (48 KB)
│   │   └── icon.js                          # Icon fonts & symbols (165 KB)
│   ├── static/
│   │   ├── js/main.94c63af5.js              # Bundle React 18 Studio App (4.25 MB)
│   │   └── css/main.b498f431.css            # Stylesheet Studio (48 KB)
│   └── assets/                              # Toàn bộ icon thanh công cụ (xương, weight, brush, layers...)
├── lib/
│   ├── dragonBones.js                       # DragonBones Web runtime (820 KB)
│   └── pixi.js                              # PixiJS renderer (1.78 MB)
├── js/ & css/                               # Vue 3 App, Ant Design Vue, Tailwind CSS
├── img/                                     # Dữ liệu hình ảnh minh họa tính năng (IK, FFD, Mesh, Physics, Onion skin...)
└── oss/assets/other/
    └── release_note.md                      # Nhật ký phát hành chi tiết các phiên bản từ 1.0.0 đến 1.2.3
```

---

## 4. Phân Tích Khoảng Trống & Lộ Trình Áp Dụng Cho Dự Án Rigora

### 4.1. Hiện trạng của Rigora
Dự án **Rigora** hiện đã xây dựng nền tảng rất vững chắc:
- `@rigora/model`: Quản lý schema canonical, phát hiện chu trình (cycle detection), snapshot JSON.
- `@rigora/animation`: Xử lý timeline, Bézier interpolation, event crossing.
- `@rigora/runtime`: Tạo ma trận phân cấp xương, setup pose evaluator.
- `@rigora/format-dragonbones` & `@rigora/format-spine-38`: Bộ chuyển đổi dữ liệu.
- `@rigora/renderer-pixi`: Mới dừng ở mức **Setup Pose Region Renderer** (vẽ sprite hình chữ nhật phẳng, chưa hỗ trợ mesh hay biến dạng).

### 4.2. Các Đề Xuất Chiến Lược Áp Dụng Trực Tiếp

#### Đề xuất 1: Lộ trình hiện thực hóa Skinned Mesh & Mesh Deformation
- **Bài học từ LoongBones**:
  - Không cần tự viết thuật toán skinning thô sơ. LoongBones sử dụng bộ đôi kinh điển: **`triangle.js` (Delaunay Triangulation)** và **`bbw.js` (Bounded Biharmonic Weights)** cùng `numeric.js`.
- **Hành động cho Rigora**:
  1. Mở rộng `@rigora/model` để bổ sung schema canonical cho `GeometryData` (mảng vertices, UVs, triangles) và `WeightData` (danh sách cặp `[boneIndex, weight]`).
  2. Bổ sung kênh timeline `DeformTimeline` trong `@rigora/animation` để lưu trữ các offset biến dạng đỉnh theo thời gian.
  3. Tận dụng trực tiếp mã nguồn `bbw.js` và `triangle.js` vừa tải về trong `raw/editor/libs/` làm thư viện tham chiếu (reference implementation) khi triển khai tính năng auto-rigging / mesh generation cho Rigora.

#### Đề xuất 2: Nâng cấp `@rigora/renderer-pixi` hỗ trợ `PIXI.Mesh`
- **Bài học từ LoongBones**:
  - LoongBones tự viết WebGL raw shader và quản lý `gl.bufferSubData`. Cách này linh hoạt nhưng phức tạp và tốn công bảo trì.
- **Hành động cho Rigora**:
  - Rigora sử dụng **PixiJS v8**. PixiJS v8 đã tích hợp sẵn `PIXI.Mesh` và `PIXI.SimpleMesh` với pipeline WebGL/WebGPU tối ưu.
  - Runtime của Rigora (`@rigora/runtime`) chỉ cần tính toán phép biến đổi **Linear Blend Skinning (LBS)**:
    $$v'_{i} = \sum_{j} w_{ij} \cdot M_j \cdot v_i$$
    sau đó cập nhật thẳng vào vị trí đỉnh của `PIXI.Mesh.geometry.getBuffer('aPosition').update(vertices)`. Điều này giúp Rigora đạt hiệu năng cực cao mà code lại gọn gàng hơn nhiều so với viết WebGL thuần.

#### Đề xuất 3: Khả năng tương thích DragonBones v6 và định dạng nhị phân `.dbbin`
- **Bài học từ LoongBones**:
  - LoongBones là đại diện chuẩn nhất hiện nay cho DragonBones v6.0 / v6.0.2, hỗ trợ các trường mới: ràng buộc đường dẫn (`pathConstraint`), vật lý (`physicsConstraint`), và binary AMF.
- **Hành động cho Rigora**:
  - Cập nhật `@rigora/format-dragonbones` để nhận diện các trường mở rộng này (dù ban đầu có thể bỏ qua hoặc cảnh báo unsupported diagnostic theo đúng triết lý của Rigora).
  - Sử dụng file export từ LoongBones làm **Golden Test Fixtures** cho Rigora để kiểm tra tính tương thích giữa hai bên.

#### Đề xuất 4: Định hướng kiến trúc khi phát triển Rigora Studio / Compatibility Lab
- **Command Pattern (`CommandManager` & `QueueCommand`)**:
  - Học tập trực tiếp kiến trúc `GMVC` của LoongBones: Nếu mở rộng `apps/compatibility-lab` thành công cụ biên tập tương tác, bắt buộc phải quản lý toàn bộ thao tác người dùng dưới dạng Command để đảm bảo khả năng Undo/Redo không bao giờ làm hỏng mô hình skeleton canonical.
- **Hệ thống Docking UI**:
  - LoongBones tự code `GBoxLayout` (tốn nhiều công sức bảo trì CSS/DOM).
  - Khuyến nghị cho Rigora: Sử dụng thư viện mã nguồn mở **Dockview** (rất nhẹ, chuẩn TypeScript, hỗ trợ cả React và Vanilla) hoặc **FlexLayout-React** để có trải nghiệm kéo thả panel chuẩn studio chuyên nghiệp mà không mất công viết lại từ đầu.

---

## 5. Kết Luận

Việc điều tra thành công và lưu trữ toàn bộ mã nguồn lõi của LoongBones mang lại cho dự án Rigora một nguồn tham chiếu thực tiễn vô giá về:
1. Thuật toán phân bổ trọng số lưới xương 2D (BBW + LBS).
2. Chuẩn dữ liệu DragonBones hiện đại nhất (v6.0.2).
3. Kiến trúc Command Pattern và Docking Panel cho Web Animation Studio.

Tất cả tài nguyên đã được lưu trữ an toàn tại [`research/loongapp/raw/`](file:///f:/ws/tools/rigora/research/loongapp/raw) và sẵn sàng để đội ngũ Rigora đối chiếu, tích hợp vào các mốc phát triển tiếp theo.
