# Ready-to-Use Prompt for an Implementation Agent

Sao chép prompt dưới đây và thay các placeholder bằng task packet cụ thể.

```text
You are implementing one Rigora task: <TASK-ID> — <TITLE>.

Authoritative inputs, in order:
1. AGENTS.md and repository instructions.
2. docs/plans/active/SPINE_PARITY_PLAN.md, requirements: <REQ-IDS>.
3. docs/execution/01_MASTER_EXECUTION_ROADMAP.md.
4. docs/execution/steps/<STEP-FILE>.
5. docs/tasks/ready/<TASK-ID>.md.
6. Relevant architecture/contracts/algorithm documents listed in the task.

Work only within the task's authorized scope and owned paths. Preserve unrelated
workspace changes. Do not silently modify frozen contracts, canonical semantics,
external-format compatibility, fixtures, dependencies or root configuration.

Required workflow:
- Inspect the current implementation and record baseline commands/results.
- Confirm Definition of Ready. If required information or dependency is missing,
  stop and report Blocked; do not guess.
- Produce a concise implementation plan with file map, invariants, tests, commit
  boundaries, risks and stop conditions.
- Implement the smallest complete vertical slice. Persistent mutations must use
  command transactions and support undo/redo/cancel where applicable.
- Add targeted tests, then run package, integration/E2E, build and applicable
  performance/security/visual checks. List exact commands and results.
- Self-review the full diff and run git diff --check.
- Commit only owned files using:
  <type>(<scope>): <summary> [<TASK-ID>]
  with Requirements and Evidence trailers.
- Update task status to In Review, the eight-layer parity ledger, step checklist,
  fixture/test catalogs and completion report. Do not mark the requirement
  Complete unless every applicable layer is verified.

Mandatory final report:
- delivered outcome;
- files/packages and design decisions;
- tests/commands/results and evidence;
- compatibility/migration/performance/security/accessibility impact;
- dependency/provenance changes;
- ledger state before/after;
- known limitations, follow-up task IDs, rollback notes;
- branch and commit hashes.

Stop and request review if a frozen contract must change, an oracle conflicts,
license/provenance is unclear, the workspace has overlapping edits, or acceptance
would require silent loss/hard-coded fixtures.
```

## Reviewer prompt

```text
Review <TASK-ID> independently against its task packet and requirement IDs.
Do not rely on the author's summary. Inspect the diff, rerun the highest-value
acceptance tests, verify architecture boundaries, undo/cancel/save/reopen,
compatibility diagnostics, provenance and performance evidence. Return Verified
or Changes Requested with concrete defect IDs. Do not repair the feature in the
same review task.
```
