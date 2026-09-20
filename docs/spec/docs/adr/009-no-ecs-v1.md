# ADR-009 — No ECS in V1 Core
Status: Accepted

## Decision
Do not build HNN skeletal authoring/runtime around an ECS.

## Rationale
The domain has strict hierarchy, ordering and version semantics. Dense runtime indices and explicit arrays provide performance without ECS complexity.

## Revisit
Only if a separate game-engine adapter demonstrates a concrete need.
