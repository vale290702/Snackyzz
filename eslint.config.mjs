import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import jsdoc from "eslint-plugin-jsdoc";

import { boundaryElements, boundaryPolicies } from "./eslint.boundaries.mjs";

const TEST_FILES = ["**/*.test.{ts,tsx}", "**/*.int.test.{ts,tsx}", "tests/**"];

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      "no-console": "error",
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
      "no-nested-ternary": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "import/order": [
        "error",
        {
          groups: [["builtin", "external"], "internal", ["parent", "sibling", "index"]],
          pathGroups: [{ pattern: "@/**", group: "internal" }],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  {
    files: ["src/**/*.tsx"],
    ignores: TEST_FILES,
    rules: {
      "max-lines-per-function": ["error", { max: 150, skipBlankLines: true, skipComments: true }],
      "react/jsx-max-depth": ["error", { max: 3 }],
      "react/jsx-no-literals": ["error", { noStrings: true, ignoreProps: true }],
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      ...TEST_FILES,
      "src/app/**",
      "src/i18n/**",
      "src/integrations/supabase/database.types.ts",
    ],
    plugins: { jsdoc },
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: { FunctionDeclaration: true, ArrowFunctionExpression: true },
        },
      ],
      "jsdoc/require-param": ["error", { checkDestructured: false }],
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-type": "off",
      "jsdoc/check-tag-names": "error",
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true } },
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": boundaryElements,
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        { default: "disallow", checkInternals: true, policies: boundaryPolicies },
      ],
    },
  },

  {
    files: TEST_FILES,
    rules: {
      "max-lines-per-function": "off",
      "boundaries/dependencies": "off",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "public/**",
    "assets/**",
    "supabase/**",
  ]),
]);
