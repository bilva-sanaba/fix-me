import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production builds are served from https://<owner>.github.io/fix-me/ on GitHub Pages,
// so assets need the repo prefix. The dev server stays at /.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/fix-me/" : "/",
}));
