# ADR-001 — Canonical Model Is Format-Neutral
Status: Accepted

## Decision
All external formats parse into a HNN canonical model. Editor/runtime never use Spine or DragonBones ASTs directly.

## Consequences
+ version isolation
+ cleaner tests
+ multi-format export
- mapping work upfront
