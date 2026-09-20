import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [
  ["package manifest", "package.json"],
  ["Tauri manifest", "src-tauri/tauri.conf.json"],
  ["Rust manifest", "src-tauri/Cargo.toml"],
];
const missing = checks.filter(([, path]) => !existsSync(path));
if (missing.length) {
  throw new Error(
    `Missing release files: ${missing.map(([name]) => name).join(", ")}`,
  );
}
try {
  execFileSync("cargo", ["--version"], { stdio: "ignore", windowsHide: true });
} catch {
  console.error(
    "Rust/Cargo is required for pnpm tauri:build but is not available on PATH.",
  );
  process.exitCode = 2;
}
console.log(
  JSON.stringify({
    frontendBuild: "covered by pnpm check",
    tauriConfig: "present",
    cargo: process.exitCode === 2 ? "missing" : "available",
  }),
);
