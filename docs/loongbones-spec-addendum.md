# LoongBones Engineering Addendum to HNN Bones Specification

> **Status:** Approved Extension Reference  
> **Source Base:** Empirical analysis of LoongBones Web v1.2.3 (`research/loongapp/`)  
> **Target Spec Base:** `spec/` (HNN Bones Technical Specification Pack)  
> **Policy:** Clean-room implementation. Preserves `spec/CHECKSUMS.sha256` intact by operating as a modular addendum contract.

---

## 1. Context & Motivation

The foundational specification pack in `spec/` defines a clean-room canonical model for 2D skeletal animation, targeting Spine 3.8 and DragonBones 5.5 JSON.

An empirical investigation of the active LoongBones Web Studio (`https://www.loongbones.app`) and its raw engine assets (archived in [`research/loongapp/raw/`](../research/loongapp/raw/)) demonstrates modern industry capabilities in browser-based skeletal authoring. This addendum documents 5 concrete technical upgrades for the Rigora roadmap.

---

## 2. Technical Addenda

### Addendum A — Advanced Auto-Weighting via BBW (Supersedes Spec 28 Part J)

- **Referenced Spec:** [`spec/docs/28_MESH_GEOMETRY_AND_WEIGHT_ALGORITHMS.md`](../spec/docs/28_MESH_GEOMETRY_AND_WEIGHT_ALGORITHMS.md) (Part J: Auto weights V1).
- **Limitation in Spec V1:** The distance heuristic $s_i = 1 / (d_i + \epsilon)^p$ produces cross-limb weight bleeding, pinching at joints, and volume loss on bendable meshes.
- **Modern Standard (LoongBones Reference):** Bounded Biharmonic Weights (**BBW**) over a 2D Constrained Delaunay Triangulation (CDT).
  - **Algorithm Formulation:** For each bone handle $j$, solve for weight function $w_j$ by minimizing the Laplacian energy subject to boundary and partition-of-unity constraints:
    $$\min_{w_j} \int_{\Omega} (\Delta w_j)^2 \, dA \quad \text{s.t.} \quad w_j|_{H_k} = \delta_{jk}, \quad 0 \le w_j \le 1, \quad \sum_j w_j = 1$$
  - **Implementation Pipeline:**
    1. **Contour & Meshing:** Use Constrained Delaunay Triangulation (`raw/editor/libs/triangle.js`) to generate well-formed internal Steiner points and avoid skinny triangles.
    2. **Sparse Laplacian Solver:** Compute cotangent Laplacian and lumped mass matrices (`laplacian_and_mass_matrices`).
    3. **Quadratic Programming Solver:** Utilize linear system solver (`raw/editor/libs/numeric-1.2.6.min.js` and `raw/editor/libs/bbw.js`) to compute non-negative smooth weights.
- **Rigora Integration Contract:**
  - Auto-weighting logic belongs strictly in authoring/editor packages (or dedicated Web Workers via Comlink), never in the runtime playback path.
  - The runtime consumes only compiled, static vertex influence arrays: `[boneIndex, weight]`.

---

### Addendum B — DragonBones 6.0.x Schema Evolution (Extends Spec 08)

- **Referenced Spec:** [`spec/docs/08_DRAGONBONES_COMPATIBILITY.md`](../spec/docs/08_DRAGONBONES_COMPATIBILITY.md).
- **Baseline Extension:** Extend `@rigora/format-dragonbones` from 5.5 to recognize DragonBones 6.0.x additions found in LoongBones:
  1. **Physics Constraints (`physicsConstraint`):**
     - Fields: `gravity`, `wind`, `damping`, `mass`, `friction`, `preheat`.
     - Runtime evaluation order: Solved after forward kinematics and before mesh deformation.
  2. **Path Constraints (`pathConstraint`):**
     - Bézier curve tracking: `spacingMode` (percent vs length), `rotateMode` (tangent follow vs offset).
  3. **Binary Serialization (`.dbbin` / AMF):**
     - Binary Action Message Format (`raw/editor/libs/amf.js`) for high-throughput asset loading.
  4. **Animation Proxies / Layer Blending:**
     - Non-destructive animation mixing between multiple timeline tracks.
- **Diagnostics Strategy:**
  - When encountering 6.0.x constraint fields in Batch 5/6 setup importers, return `DB60_UNSUPPORTED_FEATURE` diagnostics with source pointer rather than silent dropping.

---

### Addendum C — PixiJS v8 Deformable Mesh Pipeline (Extends Renderer Contract)

- **Referenced Spec:** [`docs/renderer-contract.md`](renderer-contract.md) & [`spec/docs/10_RUNTIME_ARCHITECTURE.md`](../spec/docs/10_RUNTIME_ARCHITECTURE.md).
- **Current State:** Batch 6 `PixiRegionRenderer` renders setup-only rectangular `PIXI.Sprite` instances.
- **Upgrade Path to Skinned Deformable Mesh:**
  1. **Canonical Schema (`@rigora/model`):**
     - Attachment type `Mesh`: contains `vertices` (canonical rest positions), `uvs`, `triangles` (index buffer), and `weights` (sparse bone references).
  2. **Runtime Evaluation (`@rigora/runtime`):**
     - Compute CPU Linear Blend Skinning (LBS) per frame:
       $$v'_i = \sum_{j} w_{ij} \cdot M_j^{\text{world}} \cdot (M_j^{\text{bind}})^{-1} \cdot v_i + \Delta_{\text{deform}}$$
     - Output a continuous `Float32Array` of deformed screen-space coordinates.
  3. **Pixi v8 Renderer (`@rigora/renderer-pixi`):**
     - Allocate `PIXI.Mesh` with `PIXI.MeshGeometry`.
     - Update vertex buffer dynamically via `geometry.getBuffer('aPosition').update(deformedVertices)`.
     - Reuse mesh instances by slot ID to preserve memory budgets.

---

### Addendum D — Editor Architecture: Command Bus & Docking (Extends Spec 11 & 12)

- **Referenced Spec:** [`spec/docs/11_EDITOR_ARCHITECTURE.md`](../spec/docs/11_EDITOR_ARCHITECTURE.md) and [`spec/docs/12_COMMAND_UNDO_AI_ARCHITECTURE.md`](../spec/docs/12_COMMAND_UNDO_AI_ARCHITECTURE.md).
- **Validation from LoongBones `GMVC` (`raw/editor/libs/gmvc.js`):**
  - **Symmetric Command Pattern:** Every editor action (`CreateBoneCommand`, `SetKeyframeCommand`, `ModifyWeightCommand`) executes symmetrically with explicit `undo()` reverting the canonical project store.
  - **Dual-Mode Authoring:**
    - **Rigging / Setup Mode:** Mutates rest pose, bone lengths, slot binding, mesh topology, and BBW weights.
    - **Animation / Pose Mode:** Restricts mutations to timeline keyframes and curve tangents; rest matrices are strictly read-only.
  - **Docking UI Recommendation:**
    - While LoongBones uses a proprietary `GBoxLayout`, modern Rigora web apps should employ **Dockview** (MIT) or **FlexLayout-React** for docking panel management, ensuring complete TypeScript type safety.

---

### Addendum E — Verified Tooling & Algorithm Inventory

The following reference implementations are validated and stored in `research/loongapp/raw/`:

| Component          | Raw Path                                                                                                                          | License / Origin                 | Purpose in Rigora                                 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :------------------------------- | :------------------------------------------------ |
| **BBW Skinning**   | [`research/loongapp/raw/editor/libs/bbw.js`](../research/loongapp/raw/editor/libs/bbw.js)                                         | Academic / Permissive            | Reference oracle for Auto-Weights V2 solver       |
| **Triangulation**  | [`research/loongapp/raw/editor/libs/triangle.js`](../research/loongapp/raw/editor/libs/triangle.js)                               | J. Shewchuk / Permissive JS port | 2D Constrained Delaunay Mesh generator            |
| **Numeric Solver** | [`research/loongapp/raw/editor/libs/numeric-1.2.6.min.js`](../research/loongapp/raw/editor/libs/numeric-1.2.6.min.js)             | MIT                              | Sparse matrix linear equation solver              |
| **DragonBones v6** | [`research/loongapp/raw/editor/libs/dragonBones/dragonBones.js`](../research/loongapp/raw/editor/libs/dragonBones/dragonBones.js) | MIT                              | Schema oracle for DB 6.0 constraints & AMF        |
| **Command Engine** | [`research/loongapp/raw/editor/libs/gmvc.js`](../research/loongapp/raw/editor/libs/gmvc.js)                                       | LoongBones Web                   | Architecture reference for undoable command queue |

---

## 3. Implementation Priorities for Rigora

1. **Batch 7 (`@rigora/model` & `@rigora/format-dragonbones`):**
   - Introduce `MeshAttachment` schema with UV, triangle indices, and sparse vertex weights.
   - Add parser recognition for DragonBones 6.0 `physicsConstraint` and `pathConstraint` diagnostics.
2. **Batch 8 (`@rigora/runtime` & `@rigora/animation`):**
   - Implement Linear Blend Skinning (LBS) transform loop.
   - Implement `DeformTimeline` evaluator with linear & Bézier interpolation.
3. **Batch 9 (`@rigora/renderer-pixi`):**
   - Introduce `PixiMeshRenderer` wrapping `PIXI.Mesh` with dynamic vertex buffers.
4. **Batch 10 (Studio Authoring Lab):**
   - Integrate `triangle.js` + `bbw.js` worker for automated mesh and weight generation in `apps/compatibility-lab`.
