import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["unit/**/*.spec.ts", "integration/**/*.spec.ts"],
    coverage: {
      allowExternal: true,
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: [
        "../06_IMPLEMENTATION/apps/api/src/**/*.ts",
        "../06_IMPLEMENTATION/packages/domain/src/**/*.ts",
      ],
      exclude: [
        "../06_IMPLEMENTATION/apps/api/src/server.ts",
        "../06_IMPLEMENTATION/apps/api/src/seed.ts",
      ],
    },
  },
});