import { mkdirSync, writeFileSync } from "node:fs";
import { strToU8, zipSync } from "fflate";
import {
  createProject,
  parseProject,
  serializeProject,
} from "../packages/project/dist/index.js";

const manifest = {
  format: "hnn-bones",
  formatVersion: 1,
  generator: "security-test",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: "2026-01-01T00:00:00.000Z",
  skeletons: [],
  assets: [],
  checksums: {},
};
const valid = serializeProject(createProject({}, "2026-01-01T00:00:00.000Z"));
const cases = [
  ["corrupt archive", new Uint8Array([1, 2, 3]), "NATIVE_CORRUPT_ARCHIVE"],
  [
    "path traversal",
    zipSync({
      "manifest.json": strToU8(JSON.stringify(manifest)),
      "../escape": strToU8("x"),
    }),
    "NATIVE_UNSAFE_PATH",
  ],
  [
    "malformed manifest",
    zipSync({
      "manifest.json": strToU8(
        JSON.stringify({ ...manifest, skeletons: "bad" }),
      ),
    }),
    "NATIVE_INVALID_MANIFEST",
  ],
  [
    "asset limit",
    zipSync({
      "manifest.json": strToU8(JSON.stringify(manifest)),
      "assets/a": new Uint8Array(8),
    }),
    "NATIVE_ASSET_TOO_LARGE",
    { maxAssetBytes: 4 },
  ],
  [
    "expanded limit",
    valid,
    "NATIVE_EXPANDED_ARCHIVE_TOO_LARGE",
    { maxExpandedBytes: 1 },
  ],
];
const results = cases.map(([name, bytes, expected, limits]) => {
  let actual = "NO_ERROR";
  try {
    parseProject(bytes, { limits });
  } catch (error) {
    actual = error instanceof Error ? error.message : String(error);
  }
  if (!actual.startsWith(expected))
    throw new Error(`${name}: expected ${expected}, got ${actual}`);
  return { name, expected, actual, passed: true };
});
mkdirSync("docs/release", { recursive: true });
writeFileSync(
  "docs/release/NATIVE_SECURITY_QUALIFICATION.json",
  `${JSON.stringify({ date: "2026-09-20", results }, null, 2)}\n`,
);
console.log(JSON.stringify({ cases: results.length, passed: results.length }));
