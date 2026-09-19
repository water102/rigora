import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  use: {
    browserName: "chromium",
    headless: true,
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
  webServer: {
    command:
      "pnpm --filter @rigora/compatibility-lab dev --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
