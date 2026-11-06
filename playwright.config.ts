import { defineConfig, devices } from "@playwright/test";

/** Mobilprofiler med berøring (gj. 9, B8): iPhone 13, iPhone 8, iPhone SE (320 × 568) og liggende iPhone 13 (844 × 390). */
const PROFILER = [
  { navn: "iphone13", enhet: devices["iPhone 13"] },
  { navn: "iphone8", enhet: devices["iPhone 8"] },
  { navn: "iphonese", enhet: devices["iPhone SE"] },
  { navn: "liggende", enhet: { ...devices["iPhone 13 landscape"], viewport: { width: 844, height: 390 } } },
];

export default defineConfig({
  testDir: "tester",
  timeout: 60_000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:5199" },
  webServer: {
    command: "npx vite --port 5199 --strictPort",
    url: "http://localhost:5199/formbyen/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: PROFILER.flatMap((profil) => [
    { name: `chromium-${profil.navn}`, use: { ...profil.enhet, browserName: "chromium" as const, hasTouch: true, isMobile: true } },
    { name: `webkit-${profil.navn}`, use: { ...profil.enhet, browserName: "webkit" as const, hasTouch: true, isMobile: true } },
  ]),
});
