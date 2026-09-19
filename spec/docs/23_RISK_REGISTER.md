# 23 — Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---:|---|
| Transform semantic mismatch | Critical | High | numeric golden fixtures early |
| 3.8.75 edge behavior | High | High | exact profile + repair mode |
| Spine license contamination | Critical | Medium | clean-room policy/review |
| DragonBones architectural lock-in | High | Medium | adapter + canonical model |
| Timeline DOM performance | Medium | Medium | abstraction, replace renderer |
| Weight editor UX complexity | High | High | library-first + staged UX |
| Physics divergence | High | High | deterministic clean-room solver + bake |
| Atlas rotation differences | High | Medium | dedicated fixtures |
| Export silent loss | Critical | Medium | capability validation + reports |
| Huge project memory | Medium | Medium | workers/typed arrays/lazy assets |
| Too many dependencies | Medium | Medium | wrappers + dependency review |
| AI agent architecture drift | High | High | docs, ADRs, package boundaries |
| Fixture licensing | High | Medium | synthetic/in-house corpus |
| WebView cross-platform differences | Medium | Medium | Playwright/Tauri platform CI |
| Unsupported legacy data | Medium | High | diagnostics + preserve unknown data |

## Top three risks to address first

1. Transform/constraint semantics
2. Clean-room/license boundaries
3. Spine 3.8.75 regression corpus
