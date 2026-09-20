# Batch 50: Attachment creation

- Added `createAttachmentFromLibrary` for region, mesh, clipping, path, and bounding-box authoring.
- The factory copies source geometry and emits canonical model attachment data without mutating library assets.
- Validates required texture, dimensions, and geometry inputs.
- Validation: `pnpm check`.
