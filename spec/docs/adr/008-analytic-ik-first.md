# ADR-008 — Analytic IK for Compatibility, FABRIK for Extended Chains
Status: Accepted

## Decision
Use analytic one-/two-bone IK for compatibility targets. Use FABRIK only for longer native chains or editor helpers unless semantic equivalence is proven.

## Rationale
Generic iterative solvers can produce valid but incompatible poses.
