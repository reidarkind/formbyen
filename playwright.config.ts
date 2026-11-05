import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tester",
  timeout: 60_000,
  use: { baseURL: "http://localhost:5199" },
  webServer: {
    command: "npx vite --port 5199 --strictPort",
    url: "http://localhost:5199/formbyen/",
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
