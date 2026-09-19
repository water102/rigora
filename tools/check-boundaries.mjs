import { readdir, readFile } from "node:fs/promises";

// Foundation packages deliberately have no runtime dependencies or imports.
for (const name of ["math", "diagnostics", "animation"]) {
  const root = new URL(`../packages/${name}/`, import.meta.url);
  const manifest = JSON.parse(
    await readFile(new URL("package.json", root), "utf8"),
  );
  for (const field of [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    if (Object.keys(manifest[field] ?? {}).length)
      throw new Error(`${name}: forbidden ${field}`);
  }
  for (const file of await readdir(new URL("src/", root), {
    recursive: true,
  })) {
    if (!file.endsWith(".ts")) continue;
    const source = await readFile(
      new URL(`src/${file.replaceAll("\\", "/")}`, root),
      "utf8",
    );
    if (
      /\b(?:import|require)\s*(?:\(|["'{*]|type\b)|\bexport\s+[^;]*\bfrom\s*["']/m.test(
        source,
      )
    ) {
      throw new Error(
        `${name}/${file}: foundation packages must remain import-free`,
      );
    }
  }
}
console.log("Foundation dependency boundaries passed.");
