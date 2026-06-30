import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/assets", filename);
      }
    },
  };
}

export default defineConfig({
  plugins: [figmaAssetResolver(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    outDir: "public/build",
  },

  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    https: false,
    allowedHosts: "all",
    proxy: {
      "/api": {
        target: "https://rezi-laravel.nlabs.id",
        changeOrigin: true,
        secure: true,
      },
      "/sanctum": {
        target: "https://rezi-laravel.nlabs.id",
        changeOrigin: true,
        secure: true,
      },
      "/broadcasting": {
        target: "https://rezi-laravel.nlabs.id",
        changeOrigin: true,
        secure: true,
      },
    },
  },

  assetsInclude: ["**/*.svg", "**/*.csv"],
});