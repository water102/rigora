# 18 — Native HNN File Format

## 1. Extension

Suggested:
- project: `.hbone`
- runtime export: `.hskel.json` or `.hskel`

Names are provisional.

## 2. Container

`.hbone` is ZIP-compatible.

```text
project.hbone
  manifest.json
  skeletons/*.json
  assets/images/*
  assets/atlases/*
  previews/*
  editor/state.json
  provenance/*
```

## 3. Manifest

```json
{
  "format": "hnn-bones",
  "formatVersion": "1.0.0",
  "generator": "HNN Bones",
  "createdAt": "...",
  "modifiedAt": "...",
  "skeletons": [],
  "assets": [],
  "checksums": {}
}
```

## 4. Versioning

Semantic-ish format versions:
- major: breaking schema
- minor: backward-compatible additions
- patch: corrections/clarifications

Migrations:
```text
v1 -> v2 -> v3
```
Never load old versions by scattered conditionals.

## 5. Asset identity

Assets use IDs + relative paths.
Do not use absolute machine paths inside portable project packages.

## 6. Checksums

Optional SHA-256 for:
- imported source provenance
- images
- atlas
- skeleton files

## 7. Unknown extensions

Native schema includes namespaced extension bags:

```json
"extensions": {
  "com.example.plugin": {}
}
```

Core preserves unknown extension payloads where safe.

## 8. Save safety

Desktop save:
1. write temp
2. fsync where practical
3. validate archive
4. atomic replace
5. retain recovery snapshot

Never write directly over the only good project file.
