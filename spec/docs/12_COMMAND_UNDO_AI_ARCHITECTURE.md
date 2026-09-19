# 12 — Command, Undo/Redo, Scripting and AI

## 1. Fundamental rule

No persistent mutation bypasses the command bus.

## 2. Command shape

```ts
interface EditorCommand<TPayload = unknown> {
  id: string;
  label: string;
  execute(ctx: CommandContext, payload: TPayload): CommandResult;
  undo(ctx: CommandContext): void;
  merge?(next: EditorCommand): boolean;
}
```

## 3. Required command groups

### Skeleton
- CreateBone
- DeleteBone
- ReparentBone
- RenameBone
- SetBoneTransform

### Slot/attachments
- CreateSlot
- SetAttachment
- AddMesh
- DeleteAttachment
- ChangeDrawOrder

### Mesh
- MoveVertices
- AddVertex
- DeleteVertex
- AddEdge
- Retriangulate

### Weight
- BindBone
- WeightStroke
- NormalizeWeights
- SmoothWeights

### Animation
- AddAnimation
- AddKey
- MoveKeys
- ScaleKeys
- DeleteKeys
- SetCurve

### Constraints
- AddIK
- AddTransformConstraint
- AddPathConstraint
- SetConstraintProperty

## 4. Continuous gestures

Mouse drag SHOULD:
- start transaction;
- preview transiently;
- commit one command on pointer up.

Do not create hundreds of undo entries for a single drag.

## 5. Undo stack

Requirements:
- grouping
- merge adjacent edits
- memory budget
- history labels
- dirty-state tracking
- branch discard on new edit after undo

## 6. AI interface

AI uses structured command schemas.

Example:

```json
{
  "command": "CreateBone",
  "payload": {
    "parentId": "bone_upper_arm",
    "name": "lower_arm",
    "worldStart": [120, 60],
    "worldEnd": [180, 55]
  }
}
```

Agent receives:
- command schema
- current selection
- relevant project summaries
- validation errors
- resulting command report

## 7. Security

AI/scripting layer must not gain arbitrary filesystem access through editor commands.
File operations use explicit Tauri permission APIs.

## 8. Macro recording

Because all edits are commands, macro recording can serialize command sequences.
Do not expose internal store mutation as scripting API.
