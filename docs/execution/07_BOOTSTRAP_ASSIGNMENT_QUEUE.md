# Bootstrap Assignment Queue

## 1. Nguyên tắc

Đây là queue đầu tiên để giao việc ngay. Chỉ task STEP-00 có thể `Ready` ngay sau
khi owner/reviewer/path được điền. STEP-01 và STEP-02 giữ `Backlog` cho đến khi
dependency được `Verified`.

Không sinh sẵn task STEP-03..15 trước F0/F1. Step owner materialize từng subplan
thành task 1–8 point bằng template sau khi contract liên quan đã freeze.

## 2. STEP-00 queue

| Task        | Outcome                                                     | Depends   | Initial state |
| ----------- | ----------------------------------------------------------- | --------- | ------------- |
| S00-P01-T01 | Inventory apps/packages/docs/tests/fixtures/build artifacts | —         | In Review     |
| S00-P01-T02 | Generate package dependency graph and boundary violations   | T01       | Backlog       |
| S00-P02-T01 | Document pinned toolchain and authoritative commands        | T01       | Backlog       |
| S00-P03-T01 | Run clean-checkout build/typecheck/test baseline            | P02-T01   | Backlog       |
| S00-P03-T02 | Classify every baseline failure and create defect IDs       | P03-T01   | Backlog       |
| S00-P04-T01 | Reconcile completed batch claims with code/test/product UI  | P01-T01   | Backlog       |
| S00-P04-T02 | Reconcile project checklist and compatibility claims        | P04-T01   | Backlog       |
| S00-P05-T01 | Add evidence artifact layout and schema/link/ID checks      | P02-T01   | Backlog       |
| S00-P05-T02 | Publish STEP-00 baseline and handoff report                 | all above | Backlog       |

## 3. STEP-01 queue

| Task        | Outcome                                                 | Depends                    | Initial state |
| ----------- | ------------------------------------------------------- | -------------------------- | ------------- |
| S01-P01-T01 | Ingest 209 feature requirement IDs into registry        | STEP-00                    | Backlog       |
| S01-P01-T02 | Ingest D43-01..28 and owning-ID relations               | P01-T01                    | Backlog       |
| S01-P02-T01 | Assign step/subplan/package ownership and dependencies  | P01-T02                    | Backlog       |
| S01-P03-T01 | Map source evidence to eight layer states               | STEP-00 discrepancy ledger | Backlog       |
| S01-P04-T01 | Record replicate/adapt/equivalent and provenance fields | P01-T01                    | Backlog       |
| S01-P05-T01 | Implement registry/schema validation in CI              | P01-T02                    | Backlog       |
| S01-P05-T02 | Generate parity dashboard without inflated completion   | P03-T01, P05-T01           | Backlog       |
| S01-P05-T03 | Run F0 gate and publish handoff                         | all above                  | Backlog       |

## 4. STEP-02 queue

| Task        | Outcome                                                      | Depends          | Initial state |
| ----------- | ------------------------------------------------------------ | ---------------- | ------------- |
| S02-P01-T01 | Gap matrix for every canonical entity/channel                | F0               | Backlog       |
| S02-P01-T02 | Add sequence/draw-order-folder/slider/property-map contracts | P01-T01          | Backlog       |
| S02-P02-T01 | Freeze coordinate/time/color/path/identity invariants        | P01-T01          | Backlog       |
| S02-P03-T01 | Verify command registry/transaction/rollback semantics       | STEP-00          | Backlog       |
| S02-P03-T02 | Implement async and sparse command boundaries                | P03-T01          | Backlog       |
| S02-P04-T01 | Complete stable selection IDs and editor-state split         | P01-T01          | Backlog       |
| S02-P05-T01 | Complete diagnostics/fix/background-task contracts           | P01-T01          | Backlog       |
| S02-P06-T01 | Complete native schema and migration chain                   | P01-T02, P02-T01 | Backlog       |
| S02-P06-T02 | Verify atomic save/forward block/recovery compare            | P06-T01          | Backlog       |
| S02-P07-T01 | Golden entity/channel native round-trip suite                | P01–P06          | Backlog       |
| S02-P07-T02 | Undo/redo across save/reopen integration suite               | P03, P06         | Backlog       |
| S02-P07-T03 | Run F1 gate and publish handoff                              | all above        | Backlog       |

## 5. Materialization rule

Trước khi chuyển một hàng thành `Ready`, tạo file task packet và điền:

- exact owned paths/public API/fixtures/oracles;
- owner/reviewer/estimate/dependencies;
- measurable acceptance và commands;
- forbidden changes, provenance và stop conditions;
- commit plan và completion report path.

Nếu một hàng vẫn >8 point sau khi đã biết source, tách thành `T01a/T01b` không
được dùng; tạo task ID tuần tự mới để giữ schema và traceability.
