# 14 — License and Clean-Room Engineering

> Engineering guidance, not legal advice.

## 1. DragonBones

DragonBonesJS publishes an MIT license. MIT permits use, modification and distribution subject to preserving copyright/license notices.

Maintain:
- THIRD_PARTY_NOTICES.md
- source attribution for copied/substantially derived modules
- modification notes where useful

## 2. Spine

The official Spine runtimes have their own license.
Do not assume “source visible” means MIT/open-source-compatible.

The Spine team has publicly emphasized that copying runtime implementation code can make their runtime license apply, and has described clean-room implementation as the alternative for independent runtimes.

## 3. Clean-room rules for HNN

Allowed inputs:
- public JSON format documentation;
- public user-facing editor documentation;
- user-owned exported data;
- observable behavior of legitimately used files/tools;
- independent mathematical literature;
- permissively licensed DragonBones code;
- our own tests.

Do not:
- copy official Spine runtime implementation code;
- port formulas line-by-line from Spine runtime;
- decompile proprietary editor binaries;
- bypass licensing/DRM;
- copy proprietary UI assets/branding.

## 4. Separation

Repository policy:
- `packages/format-spine-*` contains independently authored adapters.
- no official Spine runtime source vendored.
- reference screenshots/files must have provenance.
- test fixtures must be distributable or generated in-house.

## 5. Source comments

Do not write misleading comments such as “ported from Spine”.
When behavior is derived from public format docs, cite documentation URL/spec section.

## 6. Dependency audit

Before public/commercial release:
- produce SBOM;
- run license scanner;
- manually review uncommon licenses;
- verify assets/fonts/icons separately from code licenses.

## 7. Naming

Do not brand product as “Spine Clone”.
Use compatibility wording:
- “imports Spine JSON 3.8/4.2”
- “exports compatible JSON subset”

Avoid implying endorsement or affiliation.
