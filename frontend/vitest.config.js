import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/tests/setup.js",
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    include: ["src/tests/**/*.test.{js,jsx,ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{js,jsx}"],
      exclude: ["node_modules", "src/tests", "src/mocks"],
    },
  },
});
