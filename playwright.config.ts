import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "@playwright/test";
import chromium from "@sparticuz/chromium";
export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3109",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: await chromium.executablePath(),
      args: chromium.args,
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:3109/api/auth",
    env: {
      PORT: "3109",
      DATA_DIR: mkdtempSync(join(tmpdir(), "venda-browser-")),
    },
    reuseExistingServer: false,
    timeout: 30000,
  },
});
