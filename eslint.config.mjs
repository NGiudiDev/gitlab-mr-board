// 2. Dependencias externas.
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "docs/.vitepress/.temp/**", "docs/.vitepress/cache/**", "docs/.vitepress/dist/**"],
  },
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "simple-import-sort/exports": "error",
    },
  },
];
