# STEP-12 — Import, PSD and Compatibility Ingress

## Scope

`IMP-01..08`, Spine 2.1/3.5–3.8/4.0–4.3 profiles, DragonBones track,
`D43-19`.

## Outcome

Import project/data/folder/PSD theo pipeline transactional: detect → parse →
validate → capability preflight → user decision → normalize → commit. Mọi loss,
repair hoặc conflict được báo trước.

## Preconditions

- STEP-02 F1 contracts frozen; có thể chạy song song với UI steps.
- STEP-05..08 fixtures tăng dần để mở rộng coverage.

## Subplans

### P01 — Detector and source AST

- Version/format detection fail-fast; JSON/binary/project/folder routes.
- Source-version AST tách khỏi canonical; strict/compatible/repair modes.

### P02 — Spine 4.3 P0 adapter

- Full target schema/profile, unknown preservation and exact version diagnostics.
- Upgrade legacy 2.1/3.5–3.8/4.0–4.2 through version-isolated adapters.

### P03 — Project/data import UX

- File/folder, scale, all/named skeleton/animation, new/current project, rename.
- Existing attachment ignore/replace/preserve with conflict preview.

### P04 — Transaction and loss decisions

- Capability scan, dependency graph, convert/repair/preserve/drop/block.
- Preview affected objects; cancel/parse error rolls back fully.

### P05 — PSD core

- File/scale/padding/trim/hidden, output/overwrite/images path/origin.
- Deterministic layer hierarchy/names, smart object reuse and draw order.

### P06 — PSD tags and mappings

- Slot/skin/merge/ignore/scale/rotate/trim/mask/mesh/source mesh/attachment tags.
- Blend mapping, slash/path sanitize and unsupported diagnostics.

### P07 — Repeat PSD sync 4.3

- PSD under Images, source badge/tracking, missing source Problems entry.
- Delete/overwrite/orphan cleanup; retain/relink source mesh when possible.

### P08 — Corpus, fuzz and security

- Minimal fixtures by version/feature; malformed/corrupt/non-ASCII/path traversal.
- Parser mutation/fuzz, memory/size limits and deterministic import report.

## Integration slice

Import legacy/4.3 project + JSON/binary + PSD → review capability decisions →
commit → edit → repeat PSD sync → cancel/failure rollback → save/reopen.

## Gate

- Representative corpus imports reproducibly and maps all supported data.
- Every loss/repair has diagnostic + explicit user decision.
- Cancel/failure leaves pre-import document unchanged.
- Security/malformed/forward-version tests pass.
