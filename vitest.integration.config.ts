import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)), "server-only": fileURLToPath(new URL("./src/__tests__/integration/server-only.ts", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/__tests__/integration/**/*.integration.test.ts"],
    globalSetup: ["./src/__tests__/integration/global-setup.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    hookTimeout: 120000,
    testTimeout: 30000,
    env: {
      SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_ANON_KEY: "local-integration-not-a-credential",
      SUPABASE_STORAGE_BUCKET: "equipment", APP_URL: "http://127.0.0.1:3000",
      RATE_LIMIT_SECRET: "local-integration-only-not-a-secret-000000000000",
    },
  },
});
