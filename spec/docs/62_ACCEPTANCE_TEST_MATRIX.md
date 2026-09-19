# 62 — Acceptance Test Matrix

| Area | Unit | Fixture | Numeric | Visual | E2E | Perf | Security |
|---|---:|---:|---:|---:|---:|---:|---:|
| Math | ✓ |  | ✓ |  |  | ✓ |  |
| Transform | ✓ | ✓ | ✓ | ✓ |  | ✓ |  |
| Animation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |
| Spine 3.8 | ✓ | ✓ | ✓ | ✓ |  | ✓ | fuzz |
| DragonBones | ✓ | ✓ | ✓ | ✓ |  | ✓ | fuzz |
| Spine 4.2 | ✓ | ✓ | ✓ | ✓ |  | ✓ | fuzz |
| Mesh | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |
| IK/constraints | ✓ | ✓ | ✓ | ✓ |  | ✓ |  |
| Path | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |
| Physics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |
| Native format | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |
| Commands | ✓ | ✓ |  |  | ✓ | ✓ |  |
| Timeline | ✓ | ✓ |  | ✓ | ✓ | ✓ |  |
| Mesh editor | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |
| Weight editor | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |
| Export | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | fuzz |
| Recovery/migration | ✓ | ✓ |  |  | ✓ |  | ✓ |

Rule: no compatibility-sensitive subsystem may rely on screenshots alone.
