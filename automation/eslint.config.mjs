import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import globals from "globals";
import playwright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["node_modules/**", "playwright-report/**", "test-results/**", "blob-report/**"],
  },

  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      globals: globals.node,
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
          // Assertions inside the shared API validation helper still count for expect-expect.
          assertFunctionNames: ["expectSingleValidationError"],
        },
      ],
      "playwright/no-skipped-test": [
        "error",
        {
          allowConditional: true,
        },
      ],

      // Tags come from the typed FeatureTag/SuiteTag registry in src/config/test-tags.ts.
      // This rule only accepts string literals, so it cannot validate registry constants.
      // The tag guard (npm run check:tags) validates every test tag against the registry instead.
      "playwright/valid-test-tags": "off",
    },
  },

  {
    files: ["tests/setup/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name='test'] > ObjectExpression > Property[key.name='tag']",
          message: "Infrastructure setup tests must not have tags.",
        },
        {
          selector:
            "CallExpression[callee.object.name='test'][callee.property.name='describe'] > ObjectExpression > Property[key.name='tag']",
          message: "Infrastructure setup tests must not have tags.",
        },
      ],
    },
  },

  {
    files: ["tests/ui/**/*.ts"],
    rules: {
      // Isolated UI tests must use project fixtures so the API network guard is always enabled.
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@playwright/test",
              importNames: ["test", "expect"],
              allowTypeImports: true,
              message: "Import test and expect from the project fixtures in isolated UI tests.",
            },
          ],
        },
      ],
    },
  },

  eslintConfigPrettier,
]);
