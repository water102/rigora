import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { importSpine38 } from "../packages/format-spine-38/dist/index.js";
import { importDragonBones55 } from "../packages/format-dragonbones/dist/index.js";

const options = {
  namespace: "qualification",
  textures: new Map([
    ["body-image", { id: "texture:body", width: 20, height: 10 }],
  ]),
};
const cases = [
  ["spine38-region.json", importSpine38, true],
  ["dragonbones55-region.json", importDragonBones55, true],
  ["dragonbones60-constraints.json", importDragonBones55, false],
];
const results = cases.map(([file, importer, expectedSuccess]) => {
  const source = readFileSync(`tests/fixtures/imports/${file}`, "utf8");
  const result = importer(source, options);
  const passed = result.success === expectedSuccess;
  if (!passed) throw new Error(`${file}: expected success=${expectedSuccess}`);
  return {
    file,
    expectedSuccess,
    success: result.success,
    diagnostics: result.diagnostics.length,
  };
});
mkdirSync("docs/release", { recursive: true });
writeFileSync(
  "docs/release/CORPUS_QUALIFICATION.json",
  `${JSON.stringify({ date: "2026-09-20", results }, null, 2)}\n`,
);
console.log(JSON.stringify({ cases: results.length, passed: results.length }));
