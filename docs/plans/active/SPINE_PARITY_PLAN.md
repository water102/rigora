# Rigora — Spine 2D Feature and UI Parity Plan

## 1. Mục tiêu

Rigora hướng tới một editor 2D skeletal animation có parity về tính năng và
workflow với Spine 2D Professional.

Parity ở đây có nghĩa là người dùng có thể hoàn thành các quy trình chính bằng
UI: tạo rig, quản lý asset/skin, chỉnh mesh và weights, tạo animation, chỉnh
curve, preview, dùng constraints và export. Mục tiêu không phải sao chép
branding, mã nguồn hoặc giao diện pixel-perfect của Spine.

## 2. Hiện trạng sau audit

Repository đã có nền tảng kỹ thuật đáng kể:

- canonical skeletal model và validation;
- runtime transform, animation, mesh, deform, constraints và physics;
- PixiJS renderer;
- Spine 3.8/4.2 và DragonBones adapters;
- native project persistence, autosave và command-oriented editor services;
- editor shell với docking, stage, hierarchy, inspector và animation/mesh
  authoring foundations.

Khoảng cách lớn nhất hiện tại nằm ở editor workflow và độ hoàn thiện UI. Một
package hoặc runtime test không được xem là editor parity nếu người dùng chưa
thể tạo/chỉnh tính năng đó hoàn toàn bằng UI.

## 3. Định nghĩa parity

Mỗi feature chỉ được xem là hoàn thành khi có đủ các lớp sau:

1. **Data/model** — canonical schema biểu diễn được dữ liệu.
2. **Runtime** — pose, animation và rendering chạy đúng.
3. **Editor UI** — người dùng tạo và chỉnh được bằng UI.
4. **Command** — mọi thay đổi persistent đi qua command bus và undo/redo.
5. **Import/export** — mapping và giới hạn được công khai.
6. **Diagnostics** — lỗi, fallback và data loss được báo rõ.
7. **Acceptance workflow** — có fixture và browser/integration test.
8. **Performance** — có budget phù hợp cho project thực tế.

Các trạng thái cần theo dõi độc lập:

`model`, `runtime`, `editor`, `import`, `export`, `diagnostics`, `tests`,
`performance`.

## 4. Feature parity target

### Rigging

- bone hierarchy;
- create, delete, duplicate, reparent, mirror bone;
- transform, rotation, scale, shear và inheritance;
- slots và draw order;
- region, mesh, bounding box, clipping, path và point attachments;
- viewport gizmos, local/world mode, snap, guides và rulers;
- single/multi/rectangle/lasso selection;
- setup pose và animate pose.

### Asset, skins và atlas

- asset library, folder, search và filter;
- image/atlas import và texture preview;
- texture packing;
- skin create/duplicate/rename/delete;
- skin visibility và skin switching;
- skin placeholders;
- linked/shared mesh;
- skin-specific bones và constraints;
- attachment replacement.

### Mesh và weights

- vertex, edge, triangle, boundary và UV editing;
- manual triangulation;
- generate/trace mesh;
- bind/unbind bones;
- auto-weight;
- weight brush add/subtract;
- smooth, normalize, prune và weld;
- max influences và locked influences;
- weight copy/paste;
- heatmap và numeric influence table;
- soft selection/lasso;
- deform/FFD authoring.

### Animation

- animation CRUD;
- auto-key, key selected/all/changed;
- timeline và dopesheet rows;
- translate, rotate, scale, shear timelines;
- attachment, color/alpha, two-color, draw-order và event keys;
- deform/FFD keys;
- constraint mix keys;
- box select, move, scale, duplicate, mirror, copy/paste và snap;
- loop range và timeline filters.

### Graph editor

- linear, stepped và Bezier curves;
- tangent handles;
- multi-curve overlay;
- curve visibility và row filtering;
- numeric time/value editing;
- fit selected/all;
- curve copy/paste;
- rotation wrapping;
- đồng bộ graph với timeline và preview.

### Constraints và physics

- IK creation, configuration và keying;
- multi-bone pose tool;
- transform constraints;
- path drawing/editing và path constraints;
- constraint order visualization;
- constraint mix timelines;
- physics properties;
- reset/reset all;
- deterministic preview;
- bake physics to keys;
- constraint diagnostics.

### Preview và production workflow

- playback, scrub, loop và frame controls;
- preview panel riêng;
- animation mixing/crossfade/multiple tracks;
- skin switching;
- audio/event preview;
- onion skin và ghosting;
- runtime-vs-editor comparison;
- metrics, frame capture và headless render;
- autosave, crash recovery và workspace persistence.

### Compatibility

- Spine 3.8 và explicit 3.8.75 profile;
- Spine 4.2 supported subset;
- DragonBones import/export;
- native `.hbone` round-trip;
- atlas export;
- compatibility report;
- unsupported-feature warning;
- bake/fallback preview;
- batch conversion CLI.

## 5. Batch execution plan

### Batch 0 — Product parity contract

**Mục tiêu:** biến mục tiêu “tương đương Spine” thành backlog đo được.

**Deliverables:**

- parity matrix theo từng feature và workflow;
- shortcut map và panel map;
- sample projects đại diện cho rig, mesh, skin, constraints, physics và
  animation;
- acceptance criteria;
- clean-room/legal boundary;
- phân loại `implemented`, `partial`, `runtime-only`, `editor-missing` và
  `unsupported`.

**Exit gate:** mọi feature có owner, dependency, UI surface và tiêu chí nghiệm
thu.

### Batch 1 — Workspace và UI foundation

**Mục tiêu:** tạo khung editor sản phẩm hoàn chỉnh.

**Phạm vi:**

- welcome/project browser;
- main menu và toolbar;
- Setup/Animate mode;
- docking workspace và saved layouts;
- Library, Outline/Tree, Stage, Inspector, Timeline, Graph;
- Diagnostics, Export report và Console;
- command palette, shortcut manager, preferences và status bar;
- shared selection, tool, focus và document state.

**Exit gate:** mở project, bố trí workspace, chọn entity, chỉnh property, lưu
layout và undo/redo bằng UI.

### Batch 2 — Rigging workflow

**Mục tiêu:** tạo rig region-based từ project trống.

**Workflow nghiệm thu:**

`new project → import image → create bones → create slot/attachment → chỉnh
hierarchy → save → undo/redo → reopen`.

### Batch 3 — Asset, skin và atlas workflow

**Mục tiêu:** quản lý asset và tái sử dụng animation với nhiều skin.

**Exit gate:** một animation chạy với nhiều skin mà không cần duplicate
animation data.

### Batch 4 — Mesh và weight authoring

**Mục tiêu:** đạt workflow mesh/weight production.

Mỗi weight stroke phải là một command undoable duy nhất. Cần bao phủ mesh
editing, bind, auto-weight, paint, smooth, normalize, prune, weld, heatmap,
copy/paste và deform.

### Batch 5 — Timeline và Dopesheet

**Mục tiêu:** tạo animation hoàn chỉnh mà không chỉnh JSON thủ công.

Cần bao phủ keying, row filtering, selection, move/scale/snap, copy/paste,
duplicate/mirror, loop range, events, draw order, attachment, color, deform và
constraint mix.

### Batch 6 — Graph editor

**Mục tiêu:** chỉnh timing/easing chính xác trên nhiều channel.

Cần bao phủ linear/stepped/Bezier, tangent, multi-curve, numeric edit,
visibility, filtering, fit, wrapping và đồng bộ timeline.

### Batch 7 — Constraint và physics authoring

**Mục tiêu:** đưa toàn bộ runtime constraint capability vào workflow UI.

Cần bao phủ IK, pose tool, transform/path constraint, order, mix, physics,
deterministic preview, reset và bake-to-keys.

### Batch 8 — Preview và runtime parity

**Mục tiêu:** editor preview phản ánh đúng runtime/export.

Cần bao phủ playback, mixing, crossfade, multiple tracks, skin switching,
audio/events, physics, onion skin, ghosting, metrics và frame capture.

### Batch 9 — Compatibility và production hardening

**Mục tiêu:** dùng được với project thực tế và phát hành ổn định.

Cần bao phủ import/export, round-trip, atlas, reports, batch conversion, large
project performance, crash recovery, plugins, packaging, documentation và
SBOM/license audit.

## 6. Dependency graph

```text
Batch 0: Product contract
        ↓
Batch 1: Workspace/UI state
        ↓
Batch 2: Rigging
        ↓
Batch 3: Asset/Skin/Atlas
        ↓
Batch 4: Mesh/Weight
        ↓
Batch 5: Timeline/Dopesheet
        ↓
Batch 6: Graph
        ↓
Batch 7: Constraints/Physics UI
        ↓
Batch 8: Preview/Mixing
        ↓
Batch 9: Compatibility/Production
```

Runtime work có thể chạy song song, nhưng không nên mở rộng editor nếu các
interface sau chưa ổn định:

- canonical selection IDs;
- command API;
- document snapshot;
- timeline row/key model;
- viewport coordinate system;
- diagnostics model;
- import/export capability model.

## 7. Milestones

### M1 — Rigging Alpha

Người dùng tạo được rig region-based hoàn chỉnh từ project trống.

### M2 — Mesh/Animation Alpha

Người dùng tạo mesh, weight, deform và animation cơ bản.

### M3 — Animator Beta

Dopesheet, graph, skins, events, draw order, preview và mixing hoạt động.

### M4 — Rigging Beta

IK, path, transform, physics authoring và bake-to-keys hoạt động.

### M5 — Compatibility Beta

Import/export, atlas, diagnostics và round-trip ổn định.

### M6 — Spine-Parity Candidate

Đủ workflow production, performance, recovery, packaging và documentation.

## 8. Vertical slice bắt buộc

Trước khi mở rộng toàn bộ feature set, phải hoàn thành workflow dọc:

```text
Import image
  → create bone
  → create mesh
  → bind/paint weight
  → create animation
  → edit graph curve
  → preview
  → switch skin
  → export
  → reopen project
```

Workflow này phải thực hiện hoàn toàn bằng UI, không cần sửa JSON hoặc viết
code thủ công.

## 9. Definition of Done cho mỗi Batch

Mỗi Batch chỉ được đánh dấu hoàn thành khi có:

1. UI dùng được bằng chuột.
2. Shortcut chính.
3. Multi-selection nếu phù hợp.
4. Undo/redo.
5. Autosave/recovery liên quan.
6. Validation và diagnostics.
7. Runtime preview.
8. Import/export mapping.
9. Unit test cho logic.
10. Browser/integration test cho workflow.
11. Sample fixture.
12. Performance budget.
13. Documentation.
14. `pnpm check` đạt 100% trước commit.

## 10. Tiêu chí đánh giá cuối cùng

Parity không được đánh giá bằng số lượng package hoặc unit test. Cần chứng minh
bằng scenario thực tế:

- tạo nhân vật từ ảnh rời;
- tạo và chỉnh mesh;
- paint weights;
- tạo walk/run/attack animation;
- chỉnh easing bằng graph;
- đổi skin mà không nhân bản animation;
- dùng IK/path/physics;
- preview mixing;
- export runtime;
- mở lại project và bảo toàn dữ liệu.

Khi animator có thể hoàn thành các scenario trên mà không cần chỉnh JSON,
viết code hoặc dùng workaround, Rigora mới đạt mục tiêu Spine parity ở mức
workflow.

## 11. Tài liệu tham chiếu

- [Spine User Guide](https://us.esotericsoftware.com/spine-user-guide)
- [Spine Weights view](https://us.esotericsoftware.com/spine-weights)
- [Spine Graph view](https://us.esotericsoftware.com/spine-graph)
- [Spine Skins](https://us.esotericsoftware.com/spine-skins)
- [Spine Physics Constraints](https://us.esotericsoftware.com/spine-physics-constraints)
- [Spec 01: Product Scope](../../spec/docs/01_PRODUCT_SCOPE.md)
- [Spec 05: Feature Matrix](../../spec/docs/05_FEATURE_MATRIX.md)
- [Spec 11: Editor Architecture](../../spec/docs/11_EDITOR_ARCHITECTURE.md)
- [Spec 20: Roadmap](../../spec/docs/20_ROADMAP.md)
- [Spec 44: Master Execution Plan](../../spec/docs/44_MASTER_EXECUTION_PLAN.md)
