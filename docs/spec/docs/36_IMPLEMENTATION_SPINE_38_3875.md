# 36 — Implementation Spec: Spine 3.8.x and 3.8.75

This document defines concrete implementation boundaries for the Spine 3.8 family.

It intentionally avoids copying official Spine runtime implementation code.

---

## 1. Package boundary

```text
packages/format-spine-common/
packages/format-spine-38/
```

`format-spine-common` may contain:
- version parsing
- atlas parser abstractions
- shared diagnostics
- common color/string utilities

`format-spine-38` owns all 3.8-specific source AST and semantic mapping.

---

## 2. Version detection

Pseudo:

```ts
function detectSpineVersion(json: unknown): SpineVersionDetection {
  const raw = readString(json, "/skeleton/spine");

  if (!raw) {
    return {
      family: "unknown",
      exact: undefined,
      confidence: "low",
      diagnostics: ["SPINE_VERSION_MISSING"]
    };
  }

  const m = /^(\d+)\.(\d+)(?:\.(\d+))?/.exec(raw);
  if (!m) {
    return invalid(...);
  }

  return {
    major: +m[1],
    minor: +m[2],
    patch: m[3] ? +m[3] : undefined,
    exact: raw,
    family: `${m[1]}.${m[2]}`,
  };
}
```

Routing:
- family `3.8` -> `Spine38Importer`
- exact `3.8.75` -> attach 3875 compatibility profile
- other family -> do not force into 3.8 parser

---

## 3. Import pipeline

```text
JSON bytes
 -> JSON parse
 -> version detect
 -> Spine38 structural schema
 -> source AST
 -> semantic validation
 -> optional 3.8.75 repair phase
 -> normalization
 -> canonical HNN model
 -> canonical validation
 -> asset resolution
```

---

## 4. Source AST rule

Keep source names and raw field semantics here.

Example conceptual types:

```ts
interface Spine38BoneAst {
  name: string;
  parent?: string;
  length?: number;
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  shearX?: number;
  shearY?: number;
  transform?: string;
}
```

Do not use canonical `Id` until normalization.

---

## 5. Name resolution

Two-pass import:

### Pass 1
Create canonical IDs for:
- bones
- slots
- skins
- constraints
- animations

### Pass 2
Resolve source string references to IDs.

Pseudo:

```ts
const boneIdByName = new Map<string, Id>();

for (const srcBone of ast.bones) {
  const id = newId();
  boneIdByName.set(srcBone.name, id);
  canonicalBones.push(createBoneShell(id, srcBone));
}

for (const srcBone of ast.bones) {
  resolveParent(srcBone.parent, boneIdByName);
}
```

Duplicate names:
- fatal if source semantics require uniqueness;
- never silently choose first.

---

## 6. Coordinate/angle normalization

Source adapter converts:
- degrees -> canonical radians;
- source transform inheritance mode -> canonical enum;
- source color strings -> normalized channels;
- source omitted defaults -> explicit canonical values.

Use helper functions, not inline ad-hoc defaults.

---

## 7. Skeleton dimensions and metadata

Metadata not affecting runtime behavior may be preserved in provenance/extensions.

Behavior fields must be canonicalized.

---

## 8. Skins

Spine 3.8 skin structure must be handled by its actual 3.8 AST rather than assuming earlier/later layout.

Normalization:
```text
source skin name
  -> canonical SkinData
slot name
  -> slot ID
attachment key
  -> canonical attachment
```

Attachment's logical name and texture/path name must remain distinct.

---

## 9. Mesh import

Validate:
- vertex format length
- UV count
- triangle indices
- hull metadata
- linked mesh target
- deform inheritance

Weighted and unweighted vertex encodings must be decoded in the source adapter into explicit canonical vertex/influence structures.

Never leave source-packed vertex arrays inside canonical model.

---

## 10. Weighted source decoding

Create a dedicated decoder:

```ts
interface DecodedSpineVertices {
  kind: "unweighted" | "weighted";
  vertices: Vec2[] | WeightedVertex[];
}
```

Pseudo conceptual flow:

```text
if raw vertex count == expected x/y count:
    unweighted
else:
    parse packed influence stream
```

Do not infer merely from array parity; use source format semantic rules and expected vertex count.

Validate every influence bone index.

---

## 11. Linked meshes

Resolve after all attachments are parsed.

Use a pending list:

```ts
pendingLinkedMeshes.push({
  meshId,
  skinName,
  parentAttachmentName,
  slotName,
});
```

Second pass resolves links and checks cycles.

Do not duplicate shared mesh topology unnecessarily.

---

## 12. Deform normalization

Canonical deform timeline must reference canonical mesh/attachment identity.

Validate:
- target skin
- slot
- attachment
- expected vertex/deform domain
- offset bounds

Source sparse deform representation should be expanded or represented canonically in one consistent form.

Recommended authoring model:
- sparse keyframe deltas allowed
- runtime compile expands into efficient buffers

---

## 13. Curves

Normalize source curves into:
- linear
- stepped
- canonical cubic Bezier control points

If source control points use a different scaling/domain, convert during import.

Invalid/malformed curves:
- STRICT -> error
- COMPATIBLE -> warning + safe fallback
- REPAIR -> deterministic repair if known

---

## 14. 3.8.75 profile

On exact `3.8.75`:

```ts
profile = {
  family: "3.8",
  exact: "3.8.75",
  knownRisk: true,
}
```

Always emit:
`SP38_3875_KNOWN_VERSION_RISK`

Behavior by mode:

### STRICT
Known affected malformed/unsupported cases fail explicitly.

### COMPATIBLE
Load data as authored where structurally valid; warn.

### REPAIR
Apply only documented deterministic repair rules.

---

## 15. Repair architecture

```ts
interface RepairRule<TAst> {
  id: string;
  applies(ctx: RepairContext<TAst>): boolean;
  apply(ctx: RepairContext<TAst>): RepairResult;
}
```

Example flow:

```ts
for (const rule of spine3875RepairRules) {
  if (rule.applies(ctx)) {
    const result = rule.apply(ctx);
    diagnostics.push(...result.diagnostics);
    repairLog.push(result.auditEntry);
  }
}
```

Do not put repair logic in parser or runtime.

---

## 16. Repair audit entry

```ts
interface RepairAuditEntry {
  ruleId: string;
  sourcePointer: string;
  before: JsonValue;
  after: JsonValue;
  reason: string;
}
```

Persist in import report/provenance where practical.

---

## 17. IK import boundary

The 3.8 adapter translates source IK parameters into canonical IK data.

Runtime IK solver must not know:
- "Spine 3.8"
- "3.8.75"
- source field names

If 3.8 needs a special semantic value, normalize it before runtime.

---

## 18. Export 3.8

Pipeline:

```text
canonical
 -> capability check
 -> target-specific downgrade plan
 -> Spine38 target AST
 -> semantic validation
 -> JSON serialization
```

Exact 3.8.75 profile:
- explicit opt-in setting;
- exact version metadata only if target contract requires it;
- warning shown in export report.

---

## 19. Export field defaults

Choose one policy:
- omit values equal to target default;
- or emit explicit values.

For deterministic compatibility files, recommended:
- follow source format conventions;
- stable property ordering where practical;
- omit only when semantics are unambiguous.

Do not make serializer output dependent on JS object insertion accidents.

---

## 20. Golden acceptance

A Spine 3.8.75 feature is accepted when:
1. source parses;
2. canonical snapshot matches expected;
3. sampled world matrices match expected;
4. rendered vertices/draw order match expected;
5. export capability report is correct;
6. re-import of our 3.8 output preserves canonical behavior within tolerance.

3.8.75 must not be considered supported merely because LoongBones can import it.
Our own corpus is authoritative for HNN.
