import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "skull-king-server/src/**/*.test.ts",
      "skull-king-web/src/**/*.test.{ts,tsx}",
    ],
    environmentMatchGlobs: [
      ["skull-king-web/**", "happy-dom"],
    ],
  },
});
