# Library Adoption Matrix cho Rigora / Spine 4.3 Parity

> Ngày nghiên cứu: 2026-09-20  
> Phạm vi: 237 parity requirement trong [`../plans/active/SPINE_PARITY_PLAN.md`](../plans/active/SPINE_PARITY_PLAN.md); 7 `VS-*` là acceptance scenario  
> Mục tiêu: chỉ rõ phần nào nên dùng thư viện, phần nào phải bọc qua adapter,
> phần nào chỉ tham khảo thuật toán và phần nào bắt buộc tự viết semantics.

## 1. Kết luận điều hành

Source hiện tại đã có nền tảng phù hợp và **không cần thay stack**:

- Giữ PixiJS cho renderer, Comlink cho worker RPC, fflate cho ZIP, Zod cho
  validation, Radix/FlexLayout/Lucide cho shell UI, Earcut/Delaunator/RBush cho
  geometry phụ trợ.
- Có thể thêm ngay khi task tương ứng bắt đầu: `ag-psd`, `@tanstack/virtual`,
  `tinykeys`, `i18next`, `commander`, `jsep`, `fast-check`, `pixelmatch`,
  `@axe-core/playwright` và `@cyclonedx/cyclonedx-npm`.
- Chỉ thêm sau PoC/benchmark: `react-arborist`, `pixi-viewport`,
  `polygon-clipping`, `bezier-js`, `d3-contour`, `simplify-js`,
  `maxrects-packer`, `pica`, `mediabunny`, `gifenc`, `ffmpeg.wasm`, `p-queue`.
- Không giao semantics lõi cho thư viện: document model, command/undo, transform
  compensation, constraint order, IK/physics, animation mixing, curve/tangent,
  skinning/deform, compatibility conversion, export loss policy và version
  normalization phải do Rigora sở hữu.

Quy tắc ngắn gọn: **mua hạ tầng và primitive; tự viết hành vi domain**.

## 2. Ý nghĩa trạng thái

| Trạng thái  | Agent được làm gì                         | Điều kiện                                         |
| ----------- | ----------------------------------------- | ------------------------------------------------- |
| `KEEP`      | Tiếp tục dùng dependency đã có            | Không bypass adapter/contract hiện hành           |
| `ADOPT`     | Được thêm khi subplan sử dụng thực sự     | ADR ngắn, license check, fixture và lockfile      |
| `POC`       | Chỉ thêm vào nhánh/task đánh giá          | Chưa đưa vào production path trước khi qua gate   |
| `DEV-ONLY`  | Chỉ dùng test, benchmark, CI hoặc audit   | Không xuất hiện trong runtime bundle              |
| `REFERENCE` | Tham khảo API/thuật toán, có thể viết lại | Không copy code nếu license/provenance chưa duyệt |
| `BUILD`     | Tự triển khai trong domain package        | Có golden oracle và test bất biến                 |
| `AVOID`     | Không thêm ở thời điểm hiện tại           | Trùng chức năng, quá nặng hoặc tăng lock-in       |

`ADOPT` không có nghĩa là thêm dependency ngay. Agent chỉ cài khi task có call
site đầu tiên, test chứng minh giá trị và reviewer duyệt dependency delta.

## 3. Audit dependency hiện có

| Package/capability      | Hiện trạng | Quyết định | Dùng cho                                    | Lưu ý                                                                     |
| ----------------------- | ---------: | ---------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| React 19 + Vite         |         Có | `KEEP`     | UI shell/product UI                         | Không đưa state domain vào component tree                                 |
| PixiJS 8                |         Có | `KEEP`     | viewport, preview, render                   | Bọc `RendererAdapter`; runtime semantics không phụ thuộc scene graph Pixi |
| Comlink                 |         Có | `KEEP`     | worker RPC                                  | DTO phải serializable, có cancel/progress/error envelope                  |
| FlexLayout React        |         Có | `KEEP`     | dock/panel layout                           | Persist schema của Rigora, không persist raw model mù quáng               |
| Radix UI                |         Có | `KEEP`     | dialog/menu/tooltip/accessibility primitive | Styling, command và focus policy do app sở hữu                            |
| Lucide React            |         Có | `KEEP`     | icon semantic                               | Dùng icon theo nghĩa, không sao chép icon nhận diện độc quyền             |
| Zod                     |         Có | `KEEP`     | boundary validation                         | Canonical type vẫn ở model/contracts; tránh schema trùng lặp              |
| fflate                  |         Có | `KEEP`     | project package/ZIP                         | Chống zip-slip/zip-bomb; giới hạn số file và kích thước giải nén          |
| Earcut                  |         Có | `KEEP`     | triangulation                               | Sanitize polygon, kiểm `deviation`, có diagnostic/fallback                |
| Delaunator              |         Có | `KEEP`     | Delaunay/auto mesh seed                     | Stable input ordering, xử lý duplicate/degenerate                         |
| RBush                   |         Có | `KEEP`     | hit-test/spatial index                      | Index là cache có thể rebuild, không phải canonical state                 |
| clsx/CVA/tailwind-merge |         Có | `KEEP`     | UI styling                                  | Không mở rộng thành design-system dependency mới                          |

Repository root hiện còn khai báo một số candidate chưa có production import,
gồm `bezier-js`, `dexie`, `gl-matrix`, `maxrects-packer`, `pixi-viewport`,
`polygon-clipping`, `react-arborist`, `react-hook-form`, `react-router`, `zundo`
và `zustand`. Việc đã có trong lockfile **không đồng nghĩa đã được adoption**.
STEP-00 phải chuyển package thực sự dùng về owning workspace; package chưa dùng
phải được loại bỏ hoặc có task/owner/PoC gate rõ ràng. `zundo` không được thay
command/transaction history của domain.

Nguồn chính thức xác nhận PixiJS hỗ trợ WebGL/WebGPU và interaction primitives;
`pixi-viewport` v6 nhắm PixiJS v8; Comlink là RPC nhỏ trên `postMessage`; fflate
hỗ trợ ZIP/stream/worker và browser/Node. Xem [PixiJS], [pixi-viewport],
[Comlink], [fflate].

## 4. Ma trận theo các nhóm ID trong parity plan

| Prefix  | Phạm vi                         | Thư viện có thể dùng                               | Quyết định                    | Phần Rigora phải tự viết                                                       |
| ------- | ------------------------------- | -------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `UI`    | interaction contract/product UI | Radix, Lucide, TanStack Virtual, axe-core          | `KEEP` / `ADOPT` / `DEV-ONLY` | design tokens, focus/command routing, status/error/progress, parity profile    |
| `WP`    | workspace/project/navigation    | FlexLayout, Radix, Tauri official plugins          | `KEEP` / `ADOPT`              | workspace contract, recent projects, recovery, atomic save, modes              |
| `TREE`  | tree/search/organization        | TanStack Virtual; React Arborist                   | `ADOPT`; Arborist `POC`       | entity rows, hierarchy commands, DnD legality, annotations, reveal/sync        |
| `RIG`   | bones/slots/draw order          | PixiJS, pixi-viewport                              | `KEEP`; viewport `POC`        | transforms, compensation, parenting, command/undo, exact overlays              |
| `ASSET` | images/audio/assets             | Tauri fs/dialog/watch; pica                        | `ADOPT`; pica `POC`           | root policy, relink, fingerprint, sequence semantics, safe reload              |
| `TOOL`  | selection/manipulation tools    | RBush, tinykeys, JSEP                              | `KEEP` / `ADOPT`              | tool FSM, snapping policy, pivot, box/lasso semantics, expressions sandbox     |
| `ATT`   | attachment types                | Earcut, Delaunator, polygon-clipping, Bezier.js    | `KEEP` / `POC`                | canonical attachment model, clipping/path semantics, linked mesh invariants    |
| `SKIN`  | skins/mix-and-match             | virtualization primitives only                     | `ADOPT`                       | placeholder/attachment resolution, skin bones/constraints, merge/copy rules    |
| `WGT`   | mesh weights/deform             | Delaunator, Earcut, RBush, d3-contour, simplify-js | `KEEP` / `POC`                | bind/normalize/prune, brush math, deform timeline, bone remap                  |
| `CON`   | constraints/physics             | math primitives only; optional gl-matrix `POC`     | Chủ yếu `BUILD`               | IK, transform/path/physics/slider order, setup/keying/runtime parity           |
| `ANIM`  | animation/keys/mixing           | TanStack Virtual, fast-check                       | `ADOPT` / `DEV-ONLY`          | timebase, channel registry, mixing semantics, evaluation order                 |
| `DOPE`  | dopesheet/timeline              | TanStack Virtual; RBush                            | `ADOPT` / `KEEP`              | row model, key transforms, selection/history, audio/event alignment            |
| `GRAPH` | curves/graph                    | PixiJS; Bezier.js chỉ authoring helper             | `KEEP` / `POC`                | evaluator, tangent modes, stepped/bezier semantics, favor/shape preservation   |
| `VIEW`  | playback/preview/auxiliary      | PixiJS, Web Audio API, waveform helper             | `KEEP`; helper `POC`          | playback clock, mixing, ghosting, runtime validator, metric semantics          |
| `EVT`   | events/audio keys               | Web Audio API; TanStack Virtual                    | Platform / `ADOPT`            | event payload model, key UI, seek/scrub sync, export semantics                 |
| `IMP`   | import/PSD/compatibility        | ag-psd, fflate, fast-check                         | `ADOPT` / `KEEP` / `DEV-ONLY` | detector/source AST, conversion plan, loss decision, transaction, repeat-sync  |
| `EXP`   | export/render/media             | PixiJS, pica, Mediabunny, gifenc, ffmpeg.wasm      | `KEEP`; media `POC`           | export planner, capability report, deterministic frames, atomic output         |
| `PACK`  | texture packing                 | maxrects-packer, polygon-clipping, pica            | `POC`                         | placement policy, deterministic tie-breaks, per-skin rules, metadata formats   |
| `CLI`   | CLI/headless                    | Commander, JSEP, p-queue                           | `ADOPT`; queue `POC`          | stable command contract, exit codes, progress, cancellation, parity operations |
| `SET`   | settings/hotkeys/app behavior   | i18next, tinykeys, Zod                             | `ADOPT` / `KEEP`              | precedence/scopes, conflicts, profile migration, command registry, defaults    |
| `VS`    | vertical-slice acceptance       | Playwright, pixelmatch, fast-check                 | `DEV-ONLY`                    | scenario/oracle, cross-layer evidence và release gate                          |

## 5. Khuyến nghị theo capability

### 5.1 UI shell, Tree, Dopesheet và Graph

#### `@tanstack/virtual` — `ADOPT`

Dùng cho Tree lớn, danh sách Inspector, Dopesheet rows, channel list và asset
browser. Đây là thư viện headless nên Rigora vẫn kiểm soát DOM, keyboard, ARIA,
row model và selection. Điều này phù hợp hơn một widget tree đóng cho Dopesheet
và Graph.

Gate:

- 100k row synthetic benchmark không khóa main thread quá budget.
- Row height cố định/động, overscan, scroll-to-key và synchronized panes có test.
- Virtualization không làm mất focus, selection hoặc screen-reader context.

#### `react-arborist` — `POC`, không mặc định

Có sẵn virtualization, DnD, rename, selection, keyboard và controlled mode.
Chỉ chọn nếu PoC chứng minh có thể thay row renderer, legality predicate, undoable
DnD, annotations và search/reveal mà không fork thư viện. Nếu cần fork hoặc ép
domain command vào callback nội bộ, dùng TanStack Virtual + Tree model tự viết.

#### `pixi-viewport` — `POC`

Phiên bản v6 hướng tới PixiJS v8 và có drag/pinch/wheel/deceleration. Chỉ dùng
camera mechanics; tool gestures, coordinate conversion, pivot/snapping và input
priority vẫn thuộc `ViewportController` của Rigora. Tắt các plugin inertia/bounce
nếu làm sai cảm giác editor hoặc phá deterministic interaction test.

#### Radix + FlexLayout + Lucide — `KEEP`

Không thêm MUI/Ant/Blueprint hoặc Floating UI lúc này. Chúng trùng lớp primitive,
tăng bundle và tạo hai hệ focus/theme. Chỉ đánh giá Floating UI nếu có popover
ngoài khả năng Radix và có fixture chứng minh.

### 5.2 Hotkey, command palette, text và localization

#### `tinykeys` — `ADOPT` ở lớp thấp

Dùng để normalize key chord/sequence và `$mod`. Không để package này quyết định
context, priority, conflict hoặc persistence. Rigora cần `CommandRegistry`,
`KeymapProfile`, `KeybindingResolver` và scope stack riêng để hỗ trợ profile
Spine-compatible và remap.

#### `i18next` — `ADOPT`

Dùng cho message catalog, plural/context/nesting và lazy namespace. ID message
phải là semantic key của Rigora; không dùng nguyên văn text độc quyền làm key.
Không kết nối dịch vụ hosted/Locize nếu chưa có yêu cầu và phê duyệt riêng.

#### `jsep` — `ADOPT` cho parser, không cho evaluator

Dùng parse biểu thức số trong Inspector/CLI thành AST. Rigora tự whitelist node,
function, identifier và giới hạn độ sâu; evaluator không dùng `eval`,
`Function`, global object hay property access tùy ý.

#### `commander` — `ADOPT`

Dùng cho option/subcommand/help/unknown-option validation. Business operation,
progress, exit-code taxonomy và compatibility report phải gọi cùng application
services với UI, không viết logic riêng trong CLI handler.

### 5.3 Geometry, mesh, path và texture pack

#### Earcut + Delaunator + RBush — `KEEP`

- Earcut: triangulation nhanh; input phải được canonicalize và kiểm deviation.
- Delaunator: Delaunay 2D; duplicate/degenerate cần diagnostic và stable ordering.
- RBush: spatial index cho hit-test/lasso; cache phải rebuild được từ model.

#### `polygon-clipping` — `POC`

Dùng boolean union/intersection/difference cho authoring, clipping preprocessing
hoặc texture outline. Không dùng trực tiếp trong runtime evaluation. PoC phải có
holes, self-touching, near-collinear, tiny edge, large coordinate và deterministic
ordering.

#### `bezier-js` — `POC` / `REFERENCE`

Hữu ích cho split, project, length, extrema và LUT trong authoring tools. Không
dùng nó làm evaluator của animation curve/path constraint nếu semantics hoặc
version compatibility khác contract Rigora. Dùng golden fixtures để quyết định
function nào được bọc.

#### `d3-contour` + `simplify-js` — `POC`

Pipeline đề xuất cho auto mesh/trace:

1. chuyển alpha thành scalar grid;
2. marching squares bằng d3-contour;
3. canonicalize vòng/holes;
4. simplify theo tolerance bằng simplify-js;
5. validate polygon;
6. triangulate bằng Earcut/Delaunator;
7. hiển thị preview và cho người dùng chỉnh trước commit.

Không auto-commit topology mà không cho thấy diagnostic/preview.

#### `maxrects-packer` — `POC`

Dùng làm placement engine ban đầu cho atlas, sau `AtlasPackerAdapter`. Rigora tự
viết stable sort/tie-break, padding/extrusion/rotation/alias, per-skin policy,
multi-page planning, metadata exporter và reproducibility test. Nếu output không
deterministic qua engine/browser thì thay implementation, không đổi public API.

### 5.4 PSD, image, audio và video

#### `ag-psd` — `ADOPT` có capability report

Ứng viên mạnh cho `IMP-04..08` và PSD export vì chạy trong browser/worker và đọc,
ghi PSD. Adapter phải báo rõ giới hạn: một số color mode/bit-depth/PSB/text/new
feature không được hỗ trợ đầy đủ. Không silent-flatten. File không tin cậy phải
qua size/memory/layer/depth limit và chạy worker.

Interface tối thiểu:

```ts
interface PsdAdapter {
  inspect(input: Uint8Array, limits: PsdLimits): Promise<PsdManifest>;
  decode(plan: PsdImportPlan, signal: AbortSignal): Promise<PsdDecodeResult>;
  encode(plan: PsdExportPlan, signal: AbortSignal): Promise<Uint8Array>;
  capabilities(): PsdCapabilities;
}
```

#### `pica` — `POC`

Dùng resize chất lượng cao ở browser. Phải so output với pipeline CLI/headless;
nếu cần byte-identical thì canonical resampler phải nằm ở một implementation
chung, không để browser và CLI tự chọn thuật toán khác nhau.

#### `sharp` — `REFERENCE` hoặc adapter Node-only

Sharp/libvips phù hợp cho CLI/headless hiệu năng cao nhưng không phải dependency
universal của WebView/browser. Chỉ dùng sau capability negotiation và test output
so với browser path. Không để project file phụ thuộc metadata riêng của Sharp.

#### `mediabunny` — `POC` ưu tiên cho WebCodecs

Đánh giá trước cho encode/decode/mux media thuần TypeScript trong browser. PoC
phải xác minh container, codec, alpha, audio sync, frame timestamp, cancellation,
memory và Tauri WebView trên cả nền tảng mục tiêu.

#### `gifenc` — `POC`

Dùng encode GIF sau frame renderer. Palette/dither/transparency/disposal phải có
golden fixture; không coi “file mở được” là parity hình ảnh.

#### `ffmpeg.wasm` — `POC` fallback tùy chọn

Không dùng mặc định vì tải nặng, startup/memory lớn và license của wrapper không
thay thế việc rà license/cấu hình codec của FFmpeg binary. Chỉ load động cho định
dạng mà WebCodecs/Mediabunny không đáp ứng. Desktop có thể ưu tiên process/native
adapter nếu distribution/license đã được duyệt.

#### Waveform — ưu tiên tự viết cache pyramid nhỏ

`waveform-data.js` có chức năng tốt nhưng upstream đã chuyển nơi phát triển, tạo
rủi ro maintenance/provenance. Với nhu cầu hiển thị audio, min/max mip pyramid
trên PCM thường đủ nhỏ để tự viết và test. Chỉ PoC thư viện nếu annotation/segment
API tạo giá trị rõ rệt.

### 5.5 File system, ZIP, worker và persistence

#### Tauri official plugins — `ADOPT`

Dùng plugin chính thức cho file system, dialog, shell/process và watcher ở desktop.
Mọi quyền phải ở allowlist tối thiểu; renderer không nhận path/system capability
rộng. Web build dùng adapter File System Access/drag-drop tương ứng.

#### Comlink + fflate — `KEEP`

Comlink chuẩn hóa worker RPC; fflate xử lý ZIP/stream. Bao quanh bằng giới hạn,
progress và cancellation của Rigora. Không thêm pako/JSZip vì trùng chức năng.

#### Dexie — `POC` chỉ cho web autosave/cache

Không dùng IndexedDB/Dexie làm canonical project store ở desktop. Chỉ thêm nếu
web build cần autosave draft, asset cache hoặc job resume và đã định nghĩa migration,
quota, eviction, corruption recovery. Native project/package vẫn là source of truth.

#### `p-queue` — `POC`

Có thể dùng bounded concurrency cho import/export jobs. Tuy nhiên job model,
priority, cancellation, progress, retry, atomic commit và crash recovery phải
thuộc Rigora. Nếu wrapper dày hơn implementation queue nhỏ, tự viết semaphore.

### 5.6 State machine và undo/redo

#### XState — không thêm cho document state

XState có thể PoC cho wizard/import flow hoặc lifecycle background job phức tạp.
Không dùng cho canonical document, selection, undo/redo hoặc command log: các phần
đó cần transaction domain, inverse/redo, merge/coalesce và serialization riêng.

#### Zustand/zundo — `AVOID` cho domain history

Zustand có thể dùng local ephemeral UI state nếu source đã chọn, nhưng không thêm
zundo để thay command system. Snapshot/state-store undo không đủ cho transaction
cross-package, stable IDs, merge semantics, import rollback và evidence log.

### 5.7 Test, benchmark, accessibility và supply chain

| Tool                | Quyết định              | Mục tiêu                                                                       |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| Vitest              | `KEEP`/`ADOPT` dev-only | unit/contract/golden test cùng Vite stack                                      |
| Playwright          | `ADOPT` dev-only        | E2E UI, keyboard, multi-browser, screenshot orchestration                      |
| fast-check          | `ADOPT` dev-only        | property/model-based tests cho transform, parser, command sequence, round-trip |
| pixelmatch          | `ADOPT` dev-only        | pixel diff với threshold/mask được version hóa                                 |
| axe-core/Playwright | `ADOPT` dev-only        | a11y automation; vẫn cần keyboard/screen-reader review thủ công                |
| tinybench           | `ADOPT` dev-only        | microbenchmark reproducible cho geometry/evaluator/serialization               |
| CycloneDX npm       | `ADOPT` dev-only        | SBOM reproducible trong release evidence                                       |

Lưu ý: bản fast-check mới có thể yêu cầu Node mới. Agent phải chọn major tương
thích toolchain đã freeze, không nâng Node chỉ để lấy bản mới nếu không có ADR.

## 6. Phần bắt buộc tự viết

Các hạng mục sau được đánh dấu `BUILD`; thư viện chỉ cung cấp primitive:

1. **Canonical document và migration** — stable IDs, reference integrity,
   creation/evaluation order, native format, version normalization.
2. **Command transaction và history** — atomicity, inverse, merge/coalesce,
   rollback, dirty state, import/export transaction.
3. **Transform semantics** — local/world conversion, inherit modes, reparent và
   compensation theo target 4.3.
4. **Runtime evaluation** — constraint order, IK/path/transform/physics/slider,
   skinning, deform, draw order, events, audio timing.
5. **Animation semantics** — timebase, setup/current/keyed state, mixing,
   tangent/curve/favor/shape, channel registry.
6. **Compatibility/loss policy** — source AST, conversion plan, bake/drop/block,
   capability report, provenance và repeat import/PSD sync.
7. **Export plan** — deterministic frames, atomic output, naming/collision,
   target versions, runtime validator và loss manifest.
8. **Editor interaction contract** — selection history/groups, tool FSM,
   snapping, keymap scopes/conflicts, focus and command routing.

Nếu agent đề xuất package “giải quyết” một mục trên, task phải dừng ở `Blocked`
cho đến khi có ADR chứng minh semantics, version-lock, deterministic output và
khả năng thay implementation.

## 7. Adapter bắt buộc

Dependency production không được import rải rác. Chỉ các package adapter sau được
phép import vendor trực tiếp:

```text
packages/adapters/
  renderer-pixi/
  viewport-pixi/
  geometry-earcut/
  geometry-delaunay/
  geometry-polygon/
  psd-ag-psd/
  media-webcodecs/
  media-ffmpeg/
  archive-fflate/
  desktop-tauri/
  persistence-indexeddb/
```

Contract package không import vendor type. Adapter trả DTO của Rigora và phải có:

- capability query;
- structured diagnostics;
- cancellation/progress cho tác vụ dài;
- deterministic normalization;
- security/size limits;
- golden fixtures;
- một replacement test chạy contract suite với fake/alternate implementation.

## 8. Gate thêm dependency cho AI agent

Trước khi sửa `package.json`, agent phải ghi vào implementation plan:

1. Requirement ID và subplan nào cần dependency.
2. Vì sao Web/API platform hoặc package hiện có chưa đủ.
3. Trạng thái trong `dependency-decisions.json`.
4. Package/version dự kiến, upstream URL, license SPDX và ngày kiểm tra.
5. Runtime environments: browser, worker, Tauri WebView, Node/CLI.
6. Bundle/startup/memory risk và cách đo.
7. Adapter boundary và fallback/removal plan.
8. Fixtures/test/benchmark chứng minh acceptance.

Agent chỉ commit adoption khi:

- lockfile thay đổi có chủ đích và không có duplicate capability;
- license được phép theo policy dự án;
- không có critical/high advisory chưa có exception;
- production import chỉ nằm sau adapter hoặc approved facade;
- PoC report đạt budget;
- SBOM được cập nhật;
- completion report ghi dependency delta và rollback path.

Commit đề xuất:

```text
spike(<area>): evaluate <package> for <requirement IDs>
build(<area>): adopt <package> behind <adapter>
test(<area>): add vendor replacement and golden fixtures
```

Không gộp PoC thất bại và adoption vào cùng commit. PoC thất bại phải ghi kết quả
và revert/remove dependency trước khi task đóng.

## 9. Thứ tự đưa thư viện vào roadmap

| Step    | Dependency action                                                         |
| ------- | ------------------------------------------------------------------------- |
| STEP-00 | Chốt Node/package manager; thêm SBOM/audit policy, không thêm runtime lib |
| STEP-01 | Đưa registry dependency vào ledger/dashboard                              |
| STEP-02 | fast-check cho model/command/parser; giữ Zod                              |
| STEP-03 | Adopt TanStack Virtual; PoC React Arborist; giữ FlexLayout/Radix          |
| STEP-04 | PoC pixi-viewport; adopt tinykeys/JSEP nếu tool/number input cần          |
| STEP-05 | Tauri fs/watch adapter; giữ geometry core                                 |
| STEP-06 | Không thêm domain dependency; reuse virtualization                        |
| STEP-07 | PoC polygon/contour/simplify; tinybench benchmarks                        |
| STEP-08 | Không thêm solver/physics engine; property/golden tests                   |
| STEP-09 | Reuse TanStack Virtual; waveform tự viết trước                            |
| STEP-10 | PoC Bezier.js helper; evaluator vẫn custom                                |
| STEP-11 | Media timing/Web Audio wrapper; Playwright/pixel diff                     |
| STEP-12 | Adopt ag-psd; fuzz/security/size limits                                   |
| STEP-13 | PoC pica/Mediabunny/gifenc/maxrects; ffmpeg optional fallback             |
| STEP-14 | Adopt Commander/i18next/tinykeys; PoC p-queue/Dexie nếu thực sự cần       |
| STEP-15 | axe/Playwright, pixelmatch, SBOM, license/provenance freeze               |

## 10. Những package không nên thêm lúc này

- `pako`, `JSZip`: trùng fflate.
- MUI/Ant Design/Blueprint/Chakra: trùng Radix/design system, bundle và theme debt.
- Redux/MobX/Recoil cho canonical document: trùng command/document architecture.
- zundo cho domain undo: không đáp ứng transaction semantics.
- Matter.js/Planck/Rapier cho physics constraint: physics editor/runtime target có
  semantics riêng, generic engine tạo sai parity.
- Một runtime Spine/editor SDK đóng hoặc package không rõ quyền: lock-in và không
  chứng minh được full clone semantics.
- FFmpeg binary/codec bundle chưa rà license và distribution.

## 11. Nguồn chính thức

Các nguồn dưới đây là repository/tài liệu chính thức, dùng để xác minh capability,
license và giới hạn. License phải kiểm lại tại **exact release/tag** lúc cài.

### Nền tảng hiện có

- [PixiJS] — renderer WebGL/WebGPU, MIT.
- [pixi-viewport] — camera interaction; v6 cho PixiJS v8, MIT.
- [Comlink] — worker RPC trên `postMessage`, Apache-2.0.
- [fflate] — ZIP/DEFLATE streaming và worker, MIT.
- [Zod] — TypeScript schema validation, MIT.
- [FlexLayout] — docking layout cho React, MIT.

### UI và input

- [TanStack Virtual] — headless virtualization, MIT.
- [React Arborist] — tree virtualization/DnD/rename/keyboard, MIT.
- [tinykeys] — keybinding parser, MIT.
- [i18next] — localization framework, MIT.
- [XState] — state machine/actors, MIT.

### Geometry

- [Earcut] — polygon triangulation, ISC.
- [Delaunator] — Delaunay triangulation, ISC.
- [RBush] — R-tree spatial index, MIT.
- [polygon-clipping] — polygon boolean operations, MIT.
- [Bezier.js] — Bezier geometry utilities, MIT.
- [d3-contour] — marching squares contours, ISC.
- [simplify-js] — polyline simplification, BSD-2-Clause.
- [maxrects-packer] — rectangle/atlas placement, MIT.

### PSD và media

- [ag-psd] — PSD read/write trong JavaScript/browser/worker, MIT.
- [pica] — browser image resizing, MIT.
- [sharp] — Node/libvips image processing, Apache-2.0.
- [Mediabunny] — TypeScript media toolkit, MIT.
- [ffmpeg.wasm] — FFmpeg WebAssembly wrapper, MIT; binary codec license kiểm riêng.
- [gifenc] — GIF encoder, MIT.
- [waveform-data.js] — waveform data API; đánh giá maintenance trước adoption.

### CLI và quality

- [Commander] — Node CLI surface, MIT.
- [JSEP] — expression parser, MIT.
- [p-queue] — promise concurrency queue, MIT.
- [fast-check] — property/model-based testing, MIT.
- [Playwright] — browser E2E, Apache-2.0.
- [pixelmatch] — pixel-level image comparison, ISC.
- [axe-core] — accessibility engine, MPL-2.0.
- [tinybench] — benchmark harness, MIT.
- [CycloneDX npm] — npm SBOM generator, Apache-2.0.
- [Tauri file-system plugin] — official desktop capability/permission model.

[PixiJS]: https://github.com/pixijs/pixijs
[pixi-viewport]: https://github.com/pixijs-userland/pixi-viewport
[Comlink]: https://github.com/GoogleChromeLabs/comlink
[fflate]: https://github.com/101arrowz/fflate
[Zod]: https://github.com/colinhacks/zod
[FlexLayout]: https://github.com/caplin/FlexLayout
[TanStack Virtual]: https://github.com/TanStack/virtual
[React Arborist]: https://github.com/jameskerr/react-arborist
[tinykeys]: https://github.com/jamiebuilds/tinykeys
[i18next]: https://github.com/i18next/i18next
[XState]: https://github.com/statelyai/xstate
[Earcut]: https://github.com/mapbox/earcut
[Delaunator]: https://github.com/mapbox/delaunator
[RBush]: https://github.com/mourner/rbush
[polygon-clipping]: https://github.com/mfogel/polygon-clipping
[Bezier.js]: https://github.com/Pomax/bezierjs
[d3-contour]: https://github.com/d3/d3-contour
[simplify-js]: https://github.com/mourner/simplify-js
[maxrects-packer]: https://github.com/soimy/maxrects-packer
[ag-psd]: https://github.com/Agamnentzar/ag-psd
[pica]: https://github.com/nodeca/pica
[sharp]: https://github.com/lovell/sharp
[Mediabunny]: https://github.com/Vanilagy/mediabunny
[ffmpeg.wasm]: https://github.com/ffmpegwasm/ffmpeg.wasm
[gifenc]: https://github.com/mattdesl/gifenc
[waveform-data.js]: https://github.com/bbc/waveform-data.js
[Commander]: https://github.com/tj/commander.js
[JSEP]: https://github.com/EricSmekens/jsep
[p-queue]: https://github.com/sindresorhus/p-queue
[fast-check]: https://github.com/dubzzz/fast-check
[Playwright]: https://github.com/microsoft/playwright
[pixelmatch]: https://github.com/mapbox/pixelmatch
[axe-core]: https://github.com/dequelabs/axe-core
[tinybench]: https://github.com/tinylibs/tinybench
[CycloneDX npm]: https://github.com/CycloneDX/cyclonedx-node-npm
[Tauri file-system plugin]: https://v2.tauri.app/plugin/file-system/

## 12. Quyết định cuối

Phần lớn feature list **có thể dùng thư viện bổ trợ ở lớp hạ tầng, UI primitive,
geometry primitive, codec/parser và test**, nhưng không có thư viện nào thay thế
được model/runtime/compatibility semantics của target Spine 4.3. Kiến trúc đúng
là dependency sau adapter, contract do Rigora sở hữu, fixture làm oracle và luôn
có đường thay implementation.
