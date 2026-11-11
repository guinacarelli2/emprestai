import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    pool: "threads",
    maxWorkers: 1,
    include: ["scripts/__tests__/images.test.ts", "scripts/__tests__/human-production.test.ts"],
    testTimeout: 30_000,
  },
});
