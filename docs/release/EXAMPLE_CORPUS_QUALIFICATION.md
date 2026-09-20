# Local example corpus qualification

The local-only `example/` directory contains downloaded public runtime/demo
repositories used for exploratory parser testing. It is ignored by Git and is
not a release dependency.

Sources currently present:

- `EsotericSoftware/spine-runtimes`, branch `3.8`;
- `EsotericSoftware/spine-runtimes`, branch `4.2`;
- `DragonBones/Demos`;
- `DragonBones/DragonBonesJS`.

Run:

```text
pnpm release:example-corpus
```

The command records the machine-readable result in
`docs/release/EXAMPLE_CORPUS_QUALIFICATION.json`. This is a diagnostic probe,
not a release-green vendor corpus gate: the current run exercises every
recognized JSON file without importer throws, but many files require atlas
metadata and fields not yet covered by the adapters. The exact 3.8.75 and 4.2
vendor-version gates therefore remain open until the adapter and golden
expectations are qualified against the appropriate exports.
