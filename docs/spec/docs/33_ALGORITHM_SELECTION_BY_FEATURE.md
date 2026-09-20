# 33 — Feature → Algorithm → Pattern → Library Matrix

This is the fastest implementation lookup table for agents.

| Feature | Algorithm | Pattern | Preferred library | Custom responsibility |
|---|---|---|---|---|
| Bone hierarchy | parent-first traversal | Composite-ish | none | semantics |
| Transform inheritance | affine composition strategies | Strategy | gl-matrix optional | exact modes |
| Keyframe sampling | cursor + binary search | Strategy | none | exact boundaries |
| Bezier easing | cubic inversion | Strategy | bezier-js | runtime specialization |
| 1-bone IK | analytic atan2 | Strategy | DB reference/custom | semantics |
| 2-bone IK | law of cosines | Strategy | DB reference/custom | reflection/scale |
| Long-chain IK | FABRIK | Strategy | custom | native extension |
| Weighted mesh | LBS | Pipeline | none | runtime |
| Triangulation | ear clipping | Adapter | earcut | sanitation |
| Free triangulation | Delaunay | Adapter | delaunator | boundary handling |
| Auto contour | marching squares | Pipeline | choose permissive lib | thresholds |
| Contour simplify | RDP | Pipeline | custom/lib | tolerance UX |
| Hit testing | R-tree + exact tests | Adapter | rbush | priorities |
| Weight brush | radial falloff | Command/State Machine | none | UX |
| Weight smooth | graph Laplacian | Command | none | locks/normalize |
| Auto weights | inverse segment distance | Strategy | none | V1 |
| Path sample | arc-length LUT | Strategy | bezier-js | source semantics |
| Physics | fixed-step spring | Strategy | custom | compatibility |
| Physics bake | simulation + key reduction | Pipeline | worker | thresholds |
| Atlas pack | MaxRects | Adapter | maxrects-packer | export settings |
| Import Spine 3.8 | parse/normalize/repair | Adapter/Pipeline | Zod etc. | semantics |
| Import Spine 4.2 | parse/normalize | Adapter/Pipeline | Zod etc. | semantics |
| Import DB | parse/normalize | Adapter/Pipeline | Zod etc. | semantics |
| Undo | sparse inverse/delta | Command/Memento | zundo optional | transaction model |
| Tool drag | finite state machine | State | optional | tool semantics |
| Persistence | atomic save | Repository | Tauri/fflate | migration |
| Worker calls | message/RPC | Facade | Comlink | job contracts |
| Render | pose snapshot | Adapter | PixiJS | mapping |
| Tree UI | virtual tree | Adapter | react-arborist | domain commands |
| Docking | layout model | Adapter | FlexLayout | persistence |
| AI editing | structured commands | Command | schema tooling | permissions |
