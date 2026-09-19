# 59 — Work Item and Tracking Convention

## ID scheme
- `P0-*` specification/foundation
- `P1-*` runtime proof
- `P2-*` mesh runtime
- `P3-*` constraints
- `P4-*` editor foundation
- `P5-*` animation authoring
- `P6-*` mesh/weight authoring
- `P7-*` export
- `P8-*` Spine 4.2/physics
- `P9-*` hardening

## Required tracker fields
```text
ID
Title
Phase
Epic
Owner
Status
Priority
Dependencies
Relevant docs
Fixtures
Tests
Risk
Estimate points
Implementation report
```

## Status
Backlog → Ready → In Progress → Review → Done
with Blocked as an explicit state.

## Priority
- Critical
- High
- Normal
- Nice-to-have

## Relative estimate
1, 2, 3, 5, 8.
A 13-point task should normally be split before coding.

## Rule
A task may not move to Ready until the phase Definition of Ready is satisfied.
