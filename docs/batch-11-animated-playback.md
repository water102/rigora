# Batch 11: Animated Playback Runtime & Compatibility Lab Scrubber

## Overview

Batch 11 bridges static setup-pose rendering and temporal animation evaluation. It adds `createPoseSnapshot` to `@rigora/runtime`, enabling deterministic timeline evaluation of canonical animations across bone transforms, slot visibility and colors, and dynamic vertex deformations.

## Key Additions

### 1. `createPoseSnapshot` in `@rigora/runtime`

- **API Signature**:

  ```ts
  export interface PoseOptions {
    animationName?: string;
    time?: number;
    loop?: boolean;
  }

  export function createPoseSnapshot(
    skeleton: SkeletonData,
    options?: PoseOptions,
  ): {
    success: boolean;
    snapshot?: RenderSnapshot;
    diagnostics: Diagnostic[];
  };
  ```

- **Timeline Evaluation**:
  - `bone.rotate`: Evaluates continuous angles (in radians), applying CCW rotation on top of bone rest pose.
  - `bone.translate`: Evaluates $(x, y)$ displacements added to bone origin.
  - `bone.scale`: Evaluates $(s_x, s_y)$ multipliers on bone rest scales.
  - `slot.attachment`: Dynamically binds current slot attachment or hides attachment when null.
  - `slot.color`: Multiplies RGBA tint values for slots and meshes.
  - `deform`: Computes vertex displacement offsets for mesh geometries before world transform computation.
- **Diagnostics**:
  - Returns `RUNTIME_ANIMATION_NOT_FOUND` if `animationName` does not exist in `skeleton.animations`.

### 2. Canonical Fixture: `tests/fixtures/canonical/animated-skeleton.ts`

- A canonical rigged skeleton with a 1.0-second walk cycle:
  - `bone-1` rotation ($0 \to \pi/2 \to 0$).
  - `bone-2` translation ($(0, 0) \to (5, 5) \to (0, 0)$).
  - `mesh-1` deform offsets.
  - `slot-1` color tinting ($1.0 \to 0.5 \to 1.0$).

### 3. Compatibility Lab Playback Controls

- Added interactive preview controls in `apps/compatibility-lab`:
  - **Source select option**: `Animated Mesh Playback`.
  - **Play/Pause button**: Starts and stops `requestAnimationFrame` evaluation.
  - **Timeline Scrubber**: Slider to inspect any exact time $t \in [0, \text{duration}]$ with sub-frame precision.
  - **Loop toggle**: Enables cycling or clamping playback.

## Verification

- **Unit Tests (`tests/unit/playback.test.ts`)**:
  - Evaluates setup pose when no animation is specified.
  - Verifies exact bone tips, color alpha, and mesh deform across time $t=0.0$, $t=0.5$, and $t=1.0$.
  - Validates loop vs clamp wrapping logic.
  - Validates diagnostic reporting when animation name is not found.
- **Browser E2E Tests (`tests/browser/preview.spec.ts`)**:
  - Tests UI switching to animated playback, time slider scrub to $0.50$s, and Play/Pause toggle.
- **Full Gate**:
  - `pnpm check` passes 100% (12 test suites, 110 tests passed, typecheck, lint, build).
