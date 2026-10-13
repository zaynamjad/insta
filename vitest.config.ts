import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws outside a React Server build; tests run in plain Node.
      "server-only": path.resolve(__dirname, "src/lib/story/__tests__/server-only-stub.ts"),
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
