# Synthetic setup-pose fixtures

`dragonbones60-constraints.json` is an independently authored CC0-1.0 diagnostic fixture derived from the approved addendum's field inventory. Expected: reject normalization, return both constraint source pointers plus the recognized-unsupported version diagnostic. It is not an export from LoongBones and does not establish DB6 runtime conformance.

Authored independently for this repository, CC0-1.0. Source versions: Spine 3.8.75 and DragonBones 5.5. No external example assets or runtime code copied.

Both fixtures describe a root rotated 90 degrees canonically and a child translated 10 units along local X. Expected child world matrix: [0,1,-1,0,0,10]. The slot selects one 20×10 region. DragonBones requires texture metadata supplied by the test. Logical Spine attachment key is deliberately different from the display name and image path.

These validate the adapter's basic normalization and shared transform path, not complete source-runtime conformance. Animation, atlas rotation, meshes, constraints and non-normal inheritance remain unsupported.
