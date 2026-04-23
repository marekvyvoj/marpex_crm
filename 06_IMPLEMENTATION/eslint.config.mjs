import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**", ".tmp/**", "docs/openapi.yaml"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ["apps/api/**/*.ts", "packages/domain/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}", "tests/web/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);