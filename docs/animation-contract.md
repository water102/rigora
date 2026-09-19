# Batch 4 sampling contract

`@rigora/animation` provides compiled scalar timelines, easing, event traversal and a playback clock. Applying canonical vector/color channels to pose buffers and mixing tracks are future runtime integration work. Adapters must choose setup-relative versus absolute values.

Numeric key times must be nonnegative and strictly increasing. Compilation copies values and curves. Before the first key returns undefined (retain setup pose); exact keys and times after the last key return authored values. Outgoing curves control intervals. Rotation policy explicitly selects shortest or unwrapped radians; half-turn ties choose negative PI. Exact endpoints retain authored angles, even when an equivalent wrapped angle was interpolated. Unwrapped preserves multiple turns.

Bezier uses a 16-interval X lookup table, bracketed Newton iteration and bisection fallback to solve Bx(t)=time before evaluating By(t). X handles are in [0,1]; Y may overshoot.

Random access uses binary search. Optional per-player cursors advance sequentially, amortized O(1) as keys are crossed. Backwards time or a different timeline uses binary search. Explicit seek increments `AnimationClock.generation`; callers reset owned cursors with `resetTimelineCursor` when this changes. Forward random seeks should reset/omit the cursor for O(log N) lookup. Full sampler/clock integration is not yet a runtime instance API.

Event intervals are (previous,current]. At a loop boundary, outgoing duration events precede incoming zero events; these are distinct authored events. Equal-time events retain authored order. Clock starts at zero and does not automatically emit initial-zero events; explicit traversal from a negative baseline to zero can do so. Seek changes the baseline without emitting. Zero delta emits nothing. Reverse traversal raises an error. Catch-up exceeding 100000 loops raises an error before mutating clock state. Event payloads are copied on compilation and delivery. Event results intentionally allocate; full zero-allocation pose playback remains a runtime target.

Loop samples use modulo; nonlooping samples clamp. Zero duration samples at zero. Clock seek clamps negative absolute times to zero. Stateless `animationTime` supports negative modulo for direct sampling.

No dependencies added. Tests cover analytic Bezier values, flat derivatives, overshoot, cursor equivalence, spins, multi-loop boundaries, interval partition invariance, pause, seek and invalid inputs. Source compatibility fixtures remain pending.
