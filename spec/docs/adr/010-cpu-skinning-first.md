# ADR-010 — CPU Skinning First
Status: Accepted

## Decision
V1 uses CPU mesh skinning and uploads positions to PixiJS.

## Rationale
- simplest compatibility reference path;
- editor needs CPU world vertices for picking/bounds;
- easier numeric tests;
- avoids early GPU shader complexity.

## Revisit
Add optional GPU skinning only after profiling and retain CPU path as oracle.
