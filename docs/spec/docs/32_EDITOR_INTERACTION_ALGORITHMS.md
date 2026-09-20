# 32 — Editor Interaction Algorithms

## 1. Coordinate spaces

Always distinguish:
- screen
- viewport
- world
- bone local
- attachment local
- texture/UV

Every tool should name conversions explicitly.

---

## 2. Picking priority

Recommended:
1. active tool handles
2. selected-object handles
3. vertices/control points
4. bones
5. attachments/faces
6. empty stage

Resolve ties by:
- screen-space distance;
- visual/top draw order;
- current mode.

---

## 3. Transform gizmo

Translation:
- pointer delta transformed into selected coordinate space.

Rotation:
```text
startAngle = atan2(pointerStart - pivot)
nowAngle   = atan2(pointerNow - pivot)
delta      = nowAngle - startAngle
```

Scale:
- project pointer movement onto gizmo axis;
- guard pivot crossing/near-zero scale.

Modifiers:
- Shift: snap
- Alt: alternate pivot/duplicate only if deliberately specified
- Ctrl/Cmd: platform-consistent override

Do not hardcode OS assumptions in domain logic.

---

## 4. Snapping

Candidate snap sources:
- grid
- bones
- vertices
- guides
- keyframes
- integer frames

Algorithm:
1. calculate unsnapped result;
2. gather candidate deltas within screen-space threshold;
3. choose lowest-cost candidate;
4. show visual guide;
5. allow modifier to bypass.

Use screen-space threshold so snap feel is zoom-independent.

---

## 5. Marquee selection

1. convert screen rectangle to world bounds;
2. RBush coarse query;
3. exact inclusion/intersection test depending selection mode.

Modes:
- contain
- intersect

Make behavior explicit.

---

## 6. Lasso

1. sample pointer at bounded interval/distance;
2. simplify lasso polyline;
3. close polygon;
4. spatial coarse query;
5. point-in-polygon for vertices;
6. intersection test for edges/faces if required.

---

## 7. Bone creation

Click-drag:
- start = parent/new bone origin
- end = pointer release
- length = distance
- rotation = atan2
- parent chosen by active/nearest hierarchy rule

Preview is transient.
Commit one `CreateBone` command.

---

## 8. Mesh vertex drag

Use screen-space stable picking.
During drag:
- update transient geometry;
- optionally defer triangulation until movement threshold or animation frame;
- re-triangulate on commit if topology requires.

For moving existing vertices with fixed triangle topology, do not triangulate at all.

---

## 9. Weight brush transaction

Pointer down:
- snapshot sparse touched values lazily.

Move:
- query nearby vertices;
- apply brush;
- mark GPU weight visualization dirty.

Pointer up:
- normalize final;
- create one sparse `WeightStroke` command.

Cancel:
- restore touched values.

---

## 10. Timeline snapping

Key move candidate times:
- integer frame;
- nearby keys;
- playhead;
- markers.

Convert time to frame using project/animation FPS carefully:

```text
frame = round(time * fps)
time  = frame / fps
```

Do not accumulate float additions frame-by-frame for authored key positions.

---

## 11. Curve handle drag

Convert pointer to graph time/value.
Respect:
- horizontal bounds if curve representation requires them;
- linked/aligned handles mode;
- snapping;
- endpoint constraints.

Never mutate source key while dragging before transaction is committed unless transient state is clearly separated.

---

## 12. Zooming

Stage:
- zoom around pointer location.

Timeline:
- zoom around pointer time.

Graph:
- independent X/Y zoom optional.

Use exponential zoom factor for consistent feel.

---

## 13. Auto-scroll during drag

When pointer approaches panel edge:
- speed proportional to penetration into edge zone;
- cap max speed;
- update drag coordinates after scroll.

Used by:
- hierarchy drag;
- timeline keys;
- lasso.

---

## 14. Selection undo

Selection changes generally should NOT enter authored undo history.
Object creation/deletion/transforms do.

This avoids undo being polluted with clicks.

---

## 15. Interaction test strategy

Use Playwright for:
- click/drag
- modifier keys
- zoom
- undo
- selection

Keep pure geometry parts unit-tested separately.
