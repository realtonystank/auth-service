import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist",
      "node_modules",
      "eslint.config.mjs",
      "jest.config.js",
      ".dockerignore",
      "*.spec.ts",
      "test/",
      ".github",
    ],
  },
  {
    rules: {
      "no-console": "warn",
      "dot-notation": "error",
    },
  },
];
