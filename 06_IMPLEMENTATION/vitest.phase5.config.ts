import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    fs: {
      allow: [".."],
    },
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [["tests/web/**", "jsdom"]],
    include: [
      "../07_TEST_SUITE/unit/**/*.spec.ts",
      "../07_TEST_SUITE/integration/**/*.spec.ts",
      "tests/web/**/*.spec.ts",
      "tests/web/**/*.spec.tsx",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "../07_TEST_SUITE/coverage",
      include: [
        "apps/api/src/routes/customers.ts",
        "apps/api/src/routes/health.ts",
        "apps/api/src/routes/import.ts",
        "apps/api/src/routes/opportunities.ts",
        "apps/api/src/routes/auth.ts",
        "apps/api/src/routes/dashboard.ts",
        "apps/api/src/routes/report.ts",
        "apps/api/src/routes/tasks.ts",
        "apps/api/src/routes/users.ts",
        "apps/api/src/routes/visits.ts",
        "apps/web/src/components/Layout.tsx",
        "apps/web/src/pages/CustomerDetailPage.tsx",
        "apps/web/src/pages/ImportPage.tsx",
        "apps/web/src/lib/api.ts",
        "apps/web/src/pages/LoginPage.tsx",
        "apps/web/src/pages/ReportPage.tsx",
        "apps/web/src/pages/UsersPage.tsx",
        "packages/domain/src/pipeline/index.ts",
        "packages/domain/src/visits/index.ts",
      ],
    },
  },
});