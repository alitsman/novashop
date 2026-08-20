import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import playwright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: [
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "blob-report/**",
    ],
  },

  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
  },

  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ["tests/**/*.ts"],
    extends: [playwright.configs["flat/recommended"]],
    rules: {
      "playwright/expect-expect": [
        "error",
        {
          // Assertions moved into local helpers are still assertions.
          assertFunctionNames: ["expectSingleValidationErrorForField"],
        },
      ],
      "playwright/no-skipped-test": [
        "error",
        {
          allowConditional: true,
        },
      ],
    },
  },

  eslintConfigPrettier,
]);
