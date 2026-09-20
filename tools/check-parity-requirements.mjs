import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const planPath = path.join(root, "docs/plans/active/SPINE_PARITY_PLAN.md");
const countsPath = path.join(root, "docs/execution/requirement-counts.json");

const plan = readFileSync(planPath, "utf8");
const expected = JSON.parse(readFileSync(countsPath, "utf8"));
const ids = new Set(plan.match(/\b[A-Z][A-Z0-9]{1,7}-\d{2,3}\b/g) ?? []);
const actualPrefixCounts = {};

for (const id of ids) {
  const prefix = id.slice(0, id.indexOf("-"));
  actualPrefixCounts[prefix] = (actualPrefixCounts[prefix] ?? 0) + 1;
}

const featureRequirements = [...ids].filter(
  (id) => !id.startsWith("D43-") && !id.startsWith("VS-"),
).length;
const target43Deltas = actualPrefixCounts.D43 ?? 0;
const verticalSlices = actualPrefixCounts.VS ?? 0;
const parityRequirements = featureRequirements + target43Deltas;
const allIdsIncludingVerticalSlices = ids.size;

const actual = {
  featureRequirements,
  target43Deltas,
  parityRequirements,
  verticalSlices,
  allIdsIncludingVerticalSlices,
  prefixCounts: Object.fromEntries(
    Object.entries(actualPrefixCounts).sort(([a], [b]) => a.localeCompare(b)),
  ),
};

const comparableExpected = {
  featureRequirements: expected.featureRequirements,
  target43Deltas: expected.target43Deltas,
  parityRequirements: expected.parityRequirements,
  verticalSlices: expected.verticalSlices,
  allIdsIncludingVerticalSlices: expected.allIdsIncludingVerticalSlices,
  prefixCounts: expected.prefixCounts,
};

if (JSON.stringify(actual) !== JSON.stringify(comparableExpected)) {
  console.error("Parity requirement count mismatch.");
  console.error("Expected:", JSON.stringify(comparableExpected, null, 2));
  console.error("Actual:", JSON.stringify(actual, null, 2));
  console.error(
    "If scope changed intentionally, update docs/execution/requirement-counts.json in the same reviewed commit.",
  );
  process.exit(1);
}

console.log(
  `Parity requirement counts passed: ${featureRequirements} feature + ${target43Deltas} D43 = ${parityRequirements}; ${verticalSlices} vertical slices.`,
);
