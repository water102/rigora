# Batch 5 setup import contract

Batch 7 update: `detectDragonBonesVersion` and `inspectDragonBonesExtensions` now recognize DragonBones 6.0 and constraint extension locations. The 5.5 entry point returns `DB60_UNSUPPORTED_VERSION` and all recognized `DB60_UNSUPPORTED_FEATURE` pointers instead of attempting 5.5 normalization. This is recognition only, not DB6 import support. See [Batch 7 report](batch-7-mesh-db60.md).

APIs: `importSpine38(jsonText, options)` and `importDragonBones55(jsonText, options)`. Both return a discriminated transactional result: success includes canonical skeletons, diagnostics and untouched parsed source; failure includes diagnostics only. `detectSpineVersion` lives in the independent Spine common package.

Supported: Spine 3.8 numeric releases and DragonBones 5.5, bones with normal inheritance, slots and region/image attachments, default setup attachment selection, color multipliers, degree/radian and DragonBones Y-down/Y-up basis conversion. DragonBones normalized pivots are converted to centered region offsets. Source names resolve in two passes; duplicate or missing names fail. DragonBones armatures have separate ID namespaces.

Caller supplies a project-unique `namespace`. IDs are deterministic structural import IDs, independent of mutable display names once imported. Reimport after source reordering is not an identity reconciliation mechanism. Preserve IDs in native snapshots after authoring begins. Texture metadata is a map from source image path to `{id,width,height}` using original untrimmed image dimensions. Spine region dimensions come from authored dimensions or supplied texture metadata; DragonBones image dimensions require metadata. Missing texture with known dimensions warns; missing dimensions blocks. Atlas loading, crop/rotation handling and asset path resolution are not implemented here.

Exact 3.8.75 always produces `SP38_3875_KNOWN_VERSION_RISK`. Strict, compatible and repair modes currently use the same supported subset. No repair rules are invented. Unsupported behavior fields fail with source pointers in every mode, including animation, meshes, constraints, skin-required bones and non-normal inheritance. This deliberately avoids assuming that canonical filtered inheritance from Batch 3 is source-compatible. Unknown original fields remain available in successful result.source; unsupported behavior is never silently stripped into a successful skeleton. No live editor project is mutated.

Metadata from supported source objects is retained through result.source; it is not all mapped into canonical metadata. A full native project envelope, automatic version routing, animation import, renderer and export remain pending. Zero new third-party dependencies: packages use existing model and diagnostics through workspace dependencies. Typecheck builds dependency declarations first.

Primary format references (no Spine runtime implementation consulted):

- [Spine JSON format](https://us.esotericsoftware.com/spine-json-format)
- [DragonBones 5.5 format](https://github.com/DragonBones/Tools/blob/master/doc/dragonbones_json_format_5.5.md)

Synthetic fixtures are CC0 and compare expected numeric setup matrices through the shared transform evaluator. This is not the architectural proof gate: animated rendering, source reference goldens and the complete P0 corpus are still outstanding.
