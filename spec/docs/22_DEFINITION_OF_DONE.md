# 22 — Definition of Done

A feature is DONE only if all applicable items pass.

## Domain
- canonical schema exists
- invariants documented
- migration considered

## Import
- source schema/parser
- semantic mapping
- diagnostics
- malformed input tests
- fixture

## Runtime
- evaluator implemented
- numeric golden tests
- edge cases
- no obvious hot-loop allocation regression

## Renderer
- Pixi display
- visual fixture
- clipping/blend interactions if relevant

## Editor
- create/edit/delete
- undo/redo
- keyboard behavior
- serialization
- invalid-input handling

## Export
- capability validation
- target mapping
- loss report
- re-import test

## Compatibility
- Spine 3.8.75 checked if relevant
- Spine 4.2 checked if relevant
- DragonBones checked if relevant

## Documentation
- feature matrix
- diagnostics
- dependency updates
- ADR if architectural

“Works in demo” is not Done.
