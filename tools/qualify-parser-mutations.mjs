import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { importSpine38 } from "../packages/format-spine-38/dist/index.js";
import { importDragonBones55 } from "../packages/format-dragonbones/dist/index.js";

const options = {
  namespace: "mutation",
  textures: new Map([
    ["body-image", { id: "texture:body", width: 20, height: 10 }],
  ]),
};
const cases = [
  ["spine", "tests/fixtures/imports/spine38-region.json", importSpine38],
  [
    "dragonbones",
    "tests/fixtures/imports/dragonbones55-region.json",
    importDragonBones55,
  ],
];
const results = [];
for (const [family, path, importer] of cases) {
  const source = JSON.parse(readFileSync(path, "utf8"));
  for (let i = 0; i < 10; i++) {
    const mutated = structuredClone(source);
    if (family === "spine") {
      if (i % 2 === 0) mutated.bones[0].name = 42;
      else mutated.skeleton.spine = `invalid-${i}`;
      if (i % 3 === 0) delete mutated.slots;
    } else {
      if (i % 2 === 0) mutated.version = `invalid-${i}`;
      else mutated.armature[0].slot[0].parent = "missing-parent";
      if (i % 3 === 0) delete mutated.armature;
    }
    let threw = false;
    let success = false;
    let skeletons = 0;
    try {
      const result = importer(JSON.stringify(mutated), options);
      success = result.success;
      skeletons = result.skeletons?.length ?? 0;
    } catch {
      threw = true;
    }
    if (threw || (success && skeletons > 0))
      throw new Error(
        `${family} mutation ${i} produced output or threw unexpectedly`,
      );
    results.push({ family, mutation: i, success, skeletons, passed: true });
  }
}
mkdirSync("docs/release", { recursive: true });
writeFileSync(
  "docs/release/PARSER_MUTATION_QUALIFICATION.json",
  `${JSON.stringify({ date: "2026-09-20", cases: results }, null, 2)}\n`,
);
console.log(JSON.stringify({ cases: results.length, passed: results.length }));
