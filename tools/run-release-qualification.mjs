import { execFileSync } from "node:child_process";

const commands = [
  ["repository checks", "pnpm", ["check"]],
  ["browser E2E", "pnpm", ["test:browser"]],
  ["internal corpus", "pnpm", ["release:corpus"]],
  ["native security", "pnpm", ["release:security"]],
  ["parser mutations", "pnpm", ["release:parser-mutations"]],
  ["package artifacts", "pnpm", ["release:verify-artifacts"]],
];
for (const [name, command, args] of commands) {
  console.log(`\n[qualification] ${name}`);
  const executable = process.platform === "win32" ? `${command}.exe` : command;
  try {
    execFileSync(executable, args, { stdio: "inherit" });
  } catch (error) {
    console.error(`[qualification] failed: ${name}`);
    process.exit(error?.status ?? 1);
  }
}
console.log("\n[qualification] all internal gates passed");
