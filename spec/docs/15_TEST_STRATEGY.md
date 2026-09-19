# 15 — Test Strategy

## 1. Test pyramid

### Unit
- math
- curve interpolation
- schemas
- version detection
- transforms
- constraints
- weight normalization

### Semantic fixture
- parse -> canonical expected
- canonical -> pose expected

### Round-trip
- native lossless
- source-family semantic

### Visual
- screenshot comparison

### E2E
- editor workflows

### Performance
- frame time
- import/export time
- memory
- timeline interaction

## 2. Golden numeric tests

For each fixture sample at:
- setup pose
- key boundaries
- mid-curve
- before/after stepped keys
- loop boundary

Compare:
- bone world matrices
- slot attachment selection
- vertex positions
- draw order
- colors
- emitted events

## 3. Screenshot tests

Use deterministic:
- viewport
- renderer
- resolution
- time
- asset set
- antialias settings where possible

Pixel comparisons need tolerance due to GPU/browser variation.
Numeric world-space tests are authoritative.

## 4. Property-based tests

Useful for:
- affine transform composition
- matrix inversion
- weight normalization
- serialization round-trip
- random timeline ordering

## 5. Fuzzing

Fuzz parsers with:
- missing fields
- wrong types
- huge arrays
- NaN-like input strings
- cyclic references
- malicious ZIP paths
- oversized images

## 6. Security tests

Native project ZIP:
- path traversal
- decompression bomb limits
- file count limit
- max uncompressed bytes
- invalid UTF-8 filenames

## 7. Regression rule

Every fixed compatibility bug gets:
1. minimal fixture;
2. failing test;
3. fix;
4. regression ID.

## 8. CI

Required gates:
- typecheck
- lint
- unit
- fixtures
- native round-trip
- selected visual snapshots
- dependency/license checks

Nightly:
- full compatibility corpus
- performance baselines
- all screenshots
