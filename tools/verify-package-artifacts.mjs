import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const bundleRoot = "src-tauri/target/release/bundle";
const required = ["msi", "nsis"];
const missing = [];
const artifacts = [];
for (const kind of required) {
  const directory = join(bundleRoot, kind);
  if (!existsSync(directory)) {
    missing.push(kind);
    continue;
  }
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isFile() && statSync(path).size > 0)
      artifacts.push({ kind, name });
  }
  if (!artifacts.some((artifact) => artifact.kind === kind)) missing.push(kind);
}
if (missing.length) {
  console.error(
    `Missing non-empty package artifact directories: ${missing.join(", ")}`,
  );
  process.exitCode = 2;
}
console.log(
  JSON.stringify({ bundleRoot, required, missing, artifacts }, null, 2),
);
