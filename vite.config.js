import { defineConfig } from "vite";
import { cpSync } from "node:fs";
export default defineConfig({
  publicDir: false,
  plugins: [
    {
      name: "copy-authored-assets",
      closeBundle() {
        cpSync("assets", "dist/assets", { recursive: true });
      },
    },
  ],
  build: { target: "es2022" },
  server: { strictPort: true },
});
