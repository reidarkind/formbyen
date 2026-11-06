import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/formbyen/",
  // Byggedatoen vises under «Om appen». Commit-en kommer fra VITE_BYGG i GitHub-bygget (gj. 10, C3).
  define: { __BYGG__: JSON.stringify(new Date().toISOString().slice(0, 10)) },
  build: {
    rollupOptions: {
      input: ["index.html", "dev/galleri.html"],
    },
  },
  plugins: [
    VitePWA({
      registerType: "prompt",
      includeAssets: ["ikon-32.png", "ikon-192.png", "ikon-512.png", "ikon-maskable-512.png", "apple-touch-icon.png", "ikon.svg"],
      manifest: {
        name: "Formbyen",
        short_name: "Formbyen",
        description: "Bygg en by. Øv på former og klokka.",
        lang: "nb",
        start_url: "/formbyen/",
        scope: "/formbyen/",
        display: "standalone",
        orientation: "any",
        background_color: "#F7F0E3",
        theme_color: "#C8553D",
        icons: [
          { src: "ikon-192.png", sizes: "192x192", type: "image/png" },
          { src: "ikon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "ikon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,json,wasm}"],
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    alias: {
      "virtual:pwa-register": new URL("./src/test/pwa-stub.ts", import.meta.url).pathname,
    },
  },
});
