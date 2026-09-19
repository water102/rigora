# 10 — Runtime Architecture

## 1. Runtime layers

```text
SkeletonData
  -> SkeletonInstance
  -> AnimationState
  -> PoseBuffer
  -> ConstraintPipeline
  -> AttachmentEvaluator
  -> RenderSnapshot
```

## 2. No allocation in hot loop

Target steady-state playback:
- reuse pose arrays;
- reuse vertex buffers;
- avoid per-frame object creation;
- use typed arrays for large numeric buffers.

## 3. Animation state

Support:
- current animation
- multiple tracks
- mix duration
- mix alpha
- time scale
- loop
- queued transitions
- event dispatch

Canonical animation data remains immutable during playback.

## 4. Pose buffer

Store per bone:
- local transform
- world affine matrix
- dirty flags

Store per slot:
- active attachment
- color
- draw order

## 5. Constraints

Common interface:

```ts
interface RuntimeConstraint {
  order: number;
  update(ctx: ConstraintContext): void;
}
```

Constraint implementations must state:
- dependencies
- affected bones
- target
- update order
- deterministic behavior

## 6. Mesh deformation

Separate:
1. base vertices
2. deform offsets
3. weighted skinning
4. world transform

Avoid mutating authored mesh arrays.

## 7. Renderer adapter

Renderer consumes snapshot structures and is responsible for:
- Pixi texture binding
- mesh buffer upload
- clipping/masking
- blend mode
- draw ordering

Renderer does not decide skeletal semantics.

## 8. Fixed-step physics

Physics/secondary motion SHOULD support deterministic fixed step:
- e.g. 1/60 s internal
- accumulated delta
- clamp excessive catch-up
- editor scrub uses explicit reset/re-simulate/bake path

## 9. Runtime public API

Minimal:

```ts
loadSkeleton(data)
createInstance(id)
setSkin(name)
setAnimation(track, name, loop)
addAnimation(...)
update(dt)
getBounds()
subscribeEvents(...)
destroy()
```

## 10. PixiJS

Use WebGL as production default initially; WebGPU can be experimental until behavior is validated consistently.
