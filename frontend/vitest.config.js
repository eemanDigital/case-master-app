import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom", //test environment
    globals: true, // expose global variables
    setupFiles: "./setup.js", // setup file
  },
});
