# 52 — Phase 7: Export Compatibility

## Goal
Export external formats through explicit capability planning with no silent semantic loss.

Targets:
- Spine 3.8 family;
- Spine 3.8.75 exact profile;
- DragonBones 5.5-compatible.

## Entry
P2/P3 semantics stable; P5/P6 can create representative canonical data.

## A — Capability scanner
Walk actual project entities and mark each feature:
- native;
- convert;
- bake;
- drop-with-approval;
- block.

Produce entity-level issues.

## B — Export plan model/UI
For each issue expose valid actions:
- Bake
- Convert
- Remove
- Cancel.

No bytes are written while a blocker remains unresolved.

## C — Spine 3.8 target AST
Map:
- bones
- slots
- skins
- region/mesh
- weights
- linked mesh
- deform
- constraints
- animations
- events.

Do not serialize directly from canonical objects.

## D — Spine 3.8 serializer
- deterministic ordering;
- deterministic float formatting;
- explicit version;
- schema/semantic validation before save.

## E — 3.8.75 exact profile
Opt-in target:
- exact version label;
- known-risk warning;
- profile validation;
- import-back regression.

Default may remain stable 3.8-family output unless product requirement chooses exact 3.8.75.

## F — DragonBones exporter
Canonical -> DB AST -> JSON.
All unsupported semantics go through planner.

## G — Atlas
- preserve existing atlas when valid;
- repack via MaxRects;
- deterministic asset ordering;
- rotated-region tests.

## H — Round trip
HNN -> Spine38 -> HNN
HNN -> DB -> HNN

Compare:
- canonical semantics;
- sampled pose;
- geometry;
- diagnostics.

## I — Cross-format
Spine -> HNN -> DB
DB -> HNN -> Spine
used to validate controlled loss reporting.

## J — Reports
Export report includes:
- target;
- conversions;
- bakes;
- drops;
- warnings;
- checksums.

## Exit gate
- [x] all canonical feature types scanned
- [x] silent drop impossible by architecture
- [x] Spine 3.8 mandatory round-trip green
- [x] 3.8.75 exact-profile tests green
- [x] DragonBones round-trip green
- [x] rotated atlas green
- [x] deterministic serialization policy tested
- [x] export-planner E2E tests green
- [x] non-native conversions appear in report
