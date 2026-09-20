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
metadata and fields not yet covered by the adapters. Adjacent DragonBones
`*_tex.json` files are loaded when present so their real subtexture dimensions
are available to the probe. The exact 3.8.75 and 4.2
vendor-version gates therefore remain open until the adapter and golden
expectations are qualified against the appropriate exports.

The downloaded runtime branch is not an exact Spine 3.8.75 corpus: observed
Spine 3.8 files are mostly 3.8.55, with smaller groups from 3.8.26-beta,
3.8.33-beta, 3.8.76, 3.8.95 and 3.8.99. Spine 4.2 files are mostly 4.2.22.
DragonBones contains mainly 5.5 files plus 5.0 and 5.6 files. These version
distributions are included in the JSON report so they are not mistaken for
exact-version qualification.
