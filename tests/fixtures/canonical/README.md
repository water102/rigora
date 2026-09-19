# Canonical foundation fixture

`weighted-mesh.ts` (CC0-1.0, independently authored) adds one nondegenerate triangle with three UVs and sparse influences over two bones. The second vertex has equal weights. Expected: validation and native snapshot round-trip preserve all bind positions and per-influence local positions. This is model evidence, not a skinning oracle yet.

`minimal.ts` creates fresh independent skeleton data for each test. Source: authored for this repository; no external exports or runtime code. License: CC0-1.0 for this fixture. Format: canonical HNN, snapshot envelope version 1.

Expected behavior: one root, one slot and one point attachment pass validation and round-trip losslessly. Tests derive deliberately malformed inputs without changing the baseline. This is not a Spine or DragonBones compatibility oracle.
