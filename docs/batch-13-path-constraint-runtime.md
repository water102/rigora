# Batch 13: Path Geometry & Path Constraint Runtime

## Overview

Batch 13 completes **Phase 3 (Constraint Runtime)** of the Rigora architecture by implementing the Path Geometry Compiler, arc-length LUT parameterization, and deterministic **Path Constraint** solver in `@rigora/runtime`.

With Batch 13, all Phase 3 constraints (One-Bone IK, Two-Bone analytic IK, Transform Constraint, and Path Constraint) are fully operational and verified, unlocking Freeze F3.

---

## Key Additions

### 1. Path Geometry Compiler & Arc-Length Engine ([`packages/runtime/src/path.ts`](../packages/runtime/src/path.ts))

- **Cubic Bezier Evaluation**:
  - Analytical point evaluation $B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3$.
  - First derivative vector $B'(t) = 3(1-t)^2 (P_1 - P_0) + 6(1-t)t (P_2 - P_1) + 3t^2 (P_3 - P_2)$.
  - Analytical tangent angle $\theta = \text{atan2}(B'(t).y, B'(t).x)$ with fallback to anchor chords on zero-length derivatives.
- **Arc-Length Parameterization (LUT)**:
  - Generates cumulative monotonic arc-length tables.
  - Constant-speed query: $O(\log M)$ binary search to bracket target distance $[s_i, s_{i+1}]$ with linear parameter interpolation $t \in [t_i, t_{i+1}]$.
  - Parameter-speed fallback when `constantSpeed = false`.
- **Open and Closed Path Topology**:
  - Closed paths: distance modulo normalization $s = ((s \bmod L) + L) \bmod L$.
  - Open paths: distance clamping $s \in [0, L]$.
- **Deform & Linear Blend Skinning (LBS)**:
  - Supports unweighted local vertices (transformed by slot bone world matrix).
  - Supports `WeightedVertex[]` evaluated via LBS ($P_i = \sum_j w_{ij} M_{bone_j} \cdot \text{localPosition}_{ij}$), allowing upstream driver bones to deform path geometry dynamically.

---

### 2. Path Constraint Solver ([`packages/runtime/src/constraints.ts`](../packages/runtime/src/constraints.ts))

- **Position Modes**:
  - `percent`: starting distance $s_0 = \text{position} \times L$.
  - `fixed`: starting distance $s_0 = \text{position}$.
- **Spacing Modes**:
  - `length`: bone spacing dynamically derives from preceding bone length $s_i = s_{i-1} + \text{length}_{i-1} + \text{spacing}$.
  - `fixed`: equidistant fixed distance step.
  - `percent`: percentage spacing of total path length.
- **Rotation Modes**:
  - `tangent`: aligns bone world orientation with curve tangent at its sample point.
  - `chain`: aligns bone orientation pointing directly toward the next bone's origin in the chain.
  - `chainScale`: points toward next bone and scales bone length along primary axis so bone tip reaches next bone origin.
- **Mixing**:
  - Position blending with independent `mixX` and `mixY`.
  - Angle-wrapped rotation blending with `mixRotate`.
- **Descendant Propagation**:
  - Automatically updates world matrices of all child/descendant bones parented to path-constrained bones via `refreshDescendants`.

---

### 3. Canonical Fixtures & Test Suites

- **Fixture**: [`tests/fixtures/canonical/path-skeleton.ts`](../tests/fixtures/canonical/path-skeleton.ts):
  - Multi-bone chain constrained to follow paths.
  - Open cubic Bezier path attachment with high curvature.
  - Closed loop path attachment.
  - Weighted path attachment driven by bone transforms.
- **Unit Tests**: [`tests/unit/path-constraints.test.ts`](../tests/unit/path-constraints.test.ts) (12 tests):
  - Exact arc length and sampling on straight cubic segment.
  - High-curvature arc length, midpoint peak, and start/end tangents.
  - Open path clamping and closed path modulo wrapping.
  - Tangent mode positioning and orientation.
  - Chain mode bone aiming.
  - ChainScale mode bone tip contact.
  - Percent position and spacing modes.
  - Mix translation and rotation interpolation.
  - Dynamic weighted path deformation by upstream bones.
  - Closed loop wrapping.
  - Constraint chaining (IK preceding Path constraint).
  - Child bone transform inheritance from path-constrained parent.
- **Compatibility Lab & E2E**:
  - [`apps/compatibility-lab/index.html`](../apps/compatibility-lab/index.html) & [`apps/compatibility-lab/src/main.ts`](../apps/compatibility-lab/src/main.ts): added `Canonical Path Constraint` option.
  - [`tests/browser/preview.spec.ts`](../tests/browser/preview.spec.ts): browser assertion for path constraint live canvas rendering.

---

## Verification

- `pnpm check` passes 100%:
  - Typecheck: 12 workspace packages + 1 Vite app clean (`tsc --noEmit`).
  - Lint: Prettier & architectural boundaries check 100% clean.
  - Unit Tests: 14 test files, 130 tests passing (Vitest).
  - Production Build: 12 packages and Vite production bundle clean.
- `pnpm test:browser` passes 100% (2 Playwright suites).
