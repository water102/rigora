import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const raw = execFileSync("pnpm", ["licenses", "list", "--json"], {
  encoding: "utf8",
  windowsHide: true,
});
const grouped = JSON.parse(raw);
const packages = Object.entries(grouped)
  .flatMap(([license, entries]) =>
    entries.map((entry) => ({
      name: entry.name,
      version: entry.versions.join(", "),
      license,
      homepage: entry.homepage ?? null,
    })),
  )
  .sort(
    (a, b) =>
      a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
  );

mkdirSync("docs/release", { recursive: true });
writeFileSync(
  "docs/release/SBOM.json",
  JSON.stringify(
    {
      bomFormat: "CycloneDX",
      specVersion: "1.5",
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tool: "pnpm licenses list",
      },
      components: packages.map((pkg) => ({
        type: "library",
        name: pkg.name,
        version: pkg.version,
        licenses: [{ license: { id: pkg.license } }],
        ...(pkg.homepage
          ? { externalReferences: [{ type: "website", url: pkg.homepage }] }
          : {}),
      })),
    },
    null,
    2,
  ) + "\n",
);
const licenseGroups = [...new Set(packages.map((pkg) => pkg.license))].sort();
writeFileSync(
  "docs/release/THIRD_PARTY_NOTICES.md",
  `# Rigora third-party notices\n\nGenerated from the installed dependency graph with pnpm licenses list --json.\nReview this file and ship the corresponding license texts with every public package.\n\n## License summary\n\n${licenseGroups.map((license) => `- ${license}: ${packages.filter((pkg) => pkg.license === license).length} package entries`).join("\n")}\n\n## Components\n\n| Package | Version | License | Homepage |\n|---|---|---|---|\n${packages.map((pkg) => `| ${pkg.name} | ${pkg.version} | ${pkg.license} | ${pkg.homepage ?? ""} |`).join("\n")}\n`,
);
console.log(`Wrote ${packages.length} dependency entries.`);
