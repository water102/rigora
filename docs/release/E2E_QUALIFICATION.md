# Browser/E2E qualification

Run command:

```text
pnpm test:browser
```

Evidence captured on 2026-09-20:

- 3 tests passed;
- WebGL preview produced non-empty pixels for both source fixtures;
- weighted mesh and auto-mesh worker rendered on canvas;
- export planner UI produced a guarded compatibility artifact.

This qualifies the current Chromium browser smoke suite. It does not replace
native MSI/NSIS installation tests or cross-platform GPU testing.
