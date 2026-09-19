# 42 — Implementation Spec: Test Oracles, Pose Diffing and Visual Diffing

---

## 1. Goal

Compatibility work requires more than screenshots.
We need structured oracles that explain *where* behavior diverges.

---

## 2. Pose snapshot format

At sampled time:

```json
{
  "time": 0.5,
  "bones": {
    "arm": {
      "a": 1.0, "b": 0.0, "c": 0.0, "d": 1.0,
      "tx": 12.0, "ty": 8.0
    }
  },
  "slots": {
    "handSlot": {
      "attachment": "hand",
      "color": [1,1,1,1]
    }
  },
  "constraints": {},
  "events": []
}
```

Golden files should use stable logical names/fixture-local IDs.

---

## 3. Numeric diff metrics

For matrices:
- max absolute component error
- transformed origin error
- transformed bone-tip error

Bone tip is often more intuitive:

```text
tipLocal = (boneLength, 0)
tipWorld = M * tipLocal
```

Report:
- position delta
- angle delta
- scale-axis delta if useful

---

## 4. Vertex diff

For mesh:
- RMS vertex error
- max vertex error
- offending vertex ID/index

This identifies skinning/deform bugs better than image diff.

---

## 5. Timeline diff

Compare at:
- exact key times
- midpoint
- 25/50/75% interval samples
- curve extrema if relevant
- loop boundary

Random sample can supplement but not replace deterministic points.

---

## 6. Screenshot diff

Use:
- fixed viewport
- fixed image assets
- transparent/solid known background
- deterministic renderer mode

Metrics:
- pixel absolute diff
- percentage differing pixels
- optional perceptual metric

Screenshot differences alone are not enough because:
- antialiasing differs
- GPU/browser differences occur

---

## 7. Reference oracle hierarchy

Preferred truth sources:

1. mathematical invariants
2. HNN synthetic expected values
3. documented source-format behavior
4. user-owned reference exports/renderings
5. permissively licensed DragonBones behavior
6. optional isolated external runtime/editor comparison where legally appropriate

No single external tool should be treated as infallible.

---

## 8. Golden fixture folder

```text
fixture/
  source/
  assets/
  expected/
    canonical.json
    pose-0000.json
    pose-0500.json
    pose-1000.json
    diagnostics.json
    render-0500.png
  README.md
```

---

## 9. Diff report

Generate human-readable Markdown/JSON:

```text
FAIL sp38_ik_reflection @ t=0.500

Bone lowerArm:
  tip position error: 4.82 px
  rotation error: 6.1 deg

First divergence:
  afterConstraint[IK_arm]

Likely subsystem:
  IK reflection handling
```

This requires debug pipeline snapshots described in doc 41.

---

## 10. Binary search of pipeline divergence

When final pose differs:
1. compare after animation
2. compare base world transforms
3. compare after each constraint
4. compare after physics
5. compare deform
6. compare renderer geometry

This localizes bugs rapidly.

---

## 11. Corpus management

Every corpus fixture stores:
- provenance
- license
- source format/version
- expected features
- known limitations

No random production assets with unclear redistribution rights.

---

## 12. Compatibility scoreboards

Allowed internally:
- count of passing fixtures by feature/version

Do not confuse this with a claim of universal compatibility.

Example:
```text
Spine 3.8.75:
  25/25 mandatory fixtures passing
```

This means our selected corpus, not every possible asset.

---

## 13. Regression workflow

For bug:
1. minimize failing source
2. add fixture
3. capture failing diff
4. implement fix
5. record root cause
6. retain regression forever

Do not fix only large real-world asset without minimizing it.
