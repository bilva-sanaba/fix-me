import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://<owner>.github.io/fix-me/ on GitHub Pages, so assets need the repo prefix.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/fix-me/" : "/",
});
