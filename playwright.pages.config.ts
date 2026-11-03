import { defineConfig } from "@playwright/test";
import chromium from "@sparticuz/chromium";
export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results/pages",
  testMatch: "pages.spec.ts",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3110",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: await chromium.executablePath(),
      args: chromium.args.filter(
        (arg) =>
          ![
            "--single-process",
            "--disable-web-security",
            "--allow-running-insecure-content",
          ].includes(arg),
      ),
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve-pages.mjs",
    url: "http://127.0.0.1:3110/Operations-Platform/",
    reuseExistingServer: false,
    timeout: 20000,
  },
});
