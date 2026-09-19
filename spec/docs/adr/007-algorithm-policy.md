# ADR-007 — Domain Semantics Own the Algorithm Contract
Status: Accepted

## Decision
Third-party libraries may implement geometry/math utilities, but HNN owns contracts for transform, animation, constraint, skinning and compatibility behavior.

## Rationale
Replacing a library must not alter source-format semantics.

## Consequences
- adapters around geometry libraries;
- golden tests define behavior;
- library outputs are validated.
