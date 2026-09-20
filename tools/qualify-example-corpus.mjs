import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { importSpine38 } from "../packages/format-spine-38/dist/index.js";
import { importSpine42 } from "../packages/format-spine-42/dist/index.js";
import { importDragonBones55 } from "../packages/format-dragonbones/dist/index.js";

const root = "example";
function textureOptions(source, file) {
  const textures = new Map();
  const skins = source?.skins;
  if (Array.isArray(skins)) {
    for (const skin of skins) {
      for (const slots of Object.values(skin?.attachments ?? {})) {
        for (const [name, attachment] of Object.entries(slots ?? {})) {
          const path = attachment?.path ?? name;
          textures.set(path, {
            id: `example:${path}`,
            width: 4096,
            height: 4096,
          });
        }
      }
    }
  }
  for (const atlasFile of readdirSync(dirname(file))) {
    if (atlasFile.endsWith(".atlas")) {
      const lines = readFileSync(join(dirname(file), atlasFile), "utf8").split(
        /\r?\n/,
      );
      for (let index = 0; index < lines.length; index += 1) {
        const name = lines[index];
        if (!name || /^\s/.test(name) || name.includes(": ")) continue;
        for (
          let next = index + 1;
          next < Math.min(index + 8, lines.length);
          next += 1
        ) {
          const match = lines[next].match(/^\s+size:\s*(\d+)\s*,\s*(\d+)/);
          if (!match) continue;
          textures.set(name, {
            id: `example:${name}`,
            width: Number(match[1]),
            height: Number(match[2]),
          });
          break;
        }
      }
      continue;
    }
    if (!atlasFile.endsWith("_tex.json")) continue;
    try {
      const atlas = JSON.parse(
        readFileSync(join(dirname(file), atlasFile), "utf8"),
      );
      for (const region of atlas.SubTexture ?? []) {
        if (typeof region.name === "string")
          textures.set(region.name, {
            id: `example:${region.name}`,
            width: Number(region.width) || 1,
            height: Number(region.height) || 1,
          });
      }
    } catch {
      // The corpus probe records importer behavior; malformed atlas files are
      // intentionally left for the importer/security qualification stages.
    }
  }
  return {
    namespace: "example-corpus",
    textures,
  };
}

const results = [];
function jsonFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory()
      ? jsonFiles(file)
      : entry.name.endsWith(".json")
        ? [file]
        : [];
  });
}

for (const file of jsonFiles(root)) {
  let source;
  try {
    source = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  const spineVersion = source?.skeleton?.spine;
  const dragonVersion = source?.version;
  const importer =
    typeof spineVersion === "string" && spineVersion.startsWith("3.8")
      ? importSpine38
      : typeof spineVersion === "string" && spineVersion.startsWith("4.2")
        ? importSpine42
        : typeof dragonVersion === "string" && Array.isArray(source.armature)
          ? importDragonBones55
          : null;
  if (!importer) continue;
  let result;
  try {
    result = importer(JSON.stringify(source), textureOptions(source, file));
    results.push({
      file: relative(root, file),
      format:
        importer === importSpine42
          ? "spine-4.2"
          : importer === importSpine38
            ? "spine-3.8"
            : "dragonbones",
      version: spineVersion ?? dragonVersion,
      threw: false,
      success: result.success,
      diagnostics: result.diagnostics.length,
      diagnosticCodes: result.diagnostics.map((diagnostic) => diagnostic.code),
      diagnosticDetails: result.diagnostics.map(
        ({ code, message, jsonPointer }) => ({
          code,
          message,
          ...(jsonPointer ? { jsonPointer } : {}),
        }),
      ),
    });
  } catch (error) {
    results.push({
      file: relative(root, file),
      format:
        importer === importSpine42
          ? "spine-4.2"
          : importer === importSpine38
            ? "spine-3.8"
            : "dragonbones",
      version: spineVersion ?? dragonVersion,
      threw: true,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const summary = Object.fromEntries(
  ["spine-3.8", "spine-4.2", "dragonbones"].map((format) => {
    const entries = results.filter((item) => item.format === format);
    return [
      format,
      {
        files: entries.length,
        noThrow: entries.filter((item) => !item.threw).length,
        success: entries.filter((item) => item.success).length,
        failed: entries.filter((item) => item.threw || !item.success).length,
        versions: Object.fromEntries(
          [...new Set(entries.map((item) => item.version))]
            .sort()
            .map((version) => [
              version,
              entries.filter((item) => item.version === version).length,
            ]),
        ),
        diagnosticCodes: Object.fromEntries(
          [...new Set(entries.flatMap((item) => item.diagnosticCodes ?? []))]
            .sort()
            .map((code) => [
              code,
              entries.filter((item) => item.diagnosticCodes?.includes(code))
                .length,
            ]),
        ),
      },
    ];
  }),
);

mkdirSync("docs/release", { recursive: true });
writeFileSync(
  "docs/release/EXAMPLE_CORPUS_QUALIFICATION.json",
  `${JSON.stringify({ sourceRoot: root, summary, results }, null, 2)}\n`,
);
console.log(JSON.stringify({ summary, total: results.length }));
