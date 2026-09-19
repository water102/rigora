# Batch 12: Constraint Runtime (IK & Transform Solvers)

## Overview

Batch 12 implements deterministic Inverse Kinematics (One-Bone and Two-Bone Analytic IK) and Transform Constraint solvers in `@rigora/runtime`. This unlocks active constraint solving across both setup poses and temporal animations, replacing previous unsupported warnings and seamlessly updating downstream skinned meshes and child hierarchies.

## Key Additions

### 1. Constraint Solvers (`packages/runtime/src/constraints.ts`)

- **One-Bone IK (`solveOneBoneIk`)**:
  - Solves the analytic target angle $\theta_{\text{target}} = \text{atan2}(T_y - P_y, T_x - P_x)$.
  - Derives the shortest-path delta relative to the bone's current world orientation:
    $$\Delta\theta = \text{wrapAngle}(\theta_{\text{target}} - \theta_{\text{current}})$$
  - Blends by `mix` and rotates the world transformation matrix around the bone origin.
- **Two-Bone Analytic IK (`solveTwoBoneIk`)**:
  - Implements the Law of Cosines for the elbow angle:
    $$\cos(\alpha_2) = \frac{D^2 - L_1^2 - L_2^2}{2 L_1 L_2}$$
  - Clamps $\cos(\alpha_2) \in [-1, 1]$ to robustly handle unreachable targets ($D \ge L_1 + L_2$) or collapsed configurations ($D \le |L_1 - L_2|$).
  - Determines signed elbow bend according to `bendDirection` ($\pm 1$).
  - Solves parent angle:
    $$\alpha_1 = \text{atan2}(T_y - P_{1y}, T_x - P_{1x}) - \text{atan2}(L_2 \sin(\alpha_2), L_1 + L_2 \cos(\alpha_2))$$
  - Blends parent and child rotations smoothly according to `mix`.
- **Transform Constraint (`solveTransformConstraint`)**:
  - Supports both `local` and `world` property evaluation.
  - Supports both `relative` (offset) and absolute (override) modes.
  - Mixes `mixRotate`, `mixTranslateX`, `mixTranslateY`, `mixScaleX`, `mixScaleY`, and `mixShearY` independently.
- **Hierarchical Re-evaluation (`refreshDescendants`)**:
  - Automatically recalculates world transforms of all descendant bones in the compiled topological hierarchy whenever an upstream bone is altered by a constraint.

### 2. Runtime Pipeline Integration (`packages/runtime/src/index.ts`)

- Forward kinematics now executes:
  1. Bone local evaluation (setup or animated timelines).
  2. Base hierarchical forward kinematics (`evaluateTransformHierarchy`).
  3. Constraint execution in canonical list order (`applyConstraints`).
  4. Final post-constraint world matrices passed to debug bones, region attachments, and CPU Linear Blend Skinning (`MeshInstance.sampleAndEvaluate`).

### 3. Canonical Fixture & Test Suite

- **Fixture**: [`tests/fixtures/canonical/ik-skeleton.ts`](../tests/fixtures/canonical/ik-skeleton.ts):
  - 1-bone IK setup (`bone-look` aiming at `target-look`).
  - 2-bone IK setup (`bone-thigh` + `bone-shin` reaching `target-foot`).
  - Transform constraint setup (`bone-follower` tracking `bone-source`).
- **Unit Tests**: [`tests/unit/constraints.test.ts`](../tests/unit/constraints.test.ts) (7 tests):
  - 1-bone IK target alignment and `mix` interpolation.
  - 2-bone IK target contact ($D < L_1 + L_2$).
  - 2-bone IK elbow direction flipping with `bendDirection = -1`.
  - 2-bone IK full extension under unreachable targets.
  - Transform constraint rotation copy.
  - Skinned mesh vertex displacement driven by constrained bones.
- **Browser E2E Tests**: [`tests/browser/preview.spec.ts`](../tests/browser/preview.spec.ts):
  - Validates `Canonical IK & Constraints` live canvas rendering.

## Verification

- `pnpm check` passes 100% (13 test files, 117 tests passing, typecheck, lint, and build clean).
- `pnpm test:browser` passes 100% (2 Playwright suites).
