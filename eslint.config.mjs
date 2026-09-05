import typescriptParser from '@typescript-eslint/parser'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const importGroups = [
  ['^node:', '^\\u0000node:'],
  ['^@?\\w', '^\\u0000@?\\w'],
  ['^@/', '^\\u0000@/'],
  ['^\\.', '^\\u0000\\.'],
  [
    '^\\u0000.*\\.(?:css|less|scss|sass)(?:\\?.*)?$',
    '^.*\\.(?:css|less|scss|sass)(?:\\?.*)?$',
  ],
]

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'docs/.vitepress/.temp/**', 'docs/.vitepress/cache/**', 'docs/.vitepress/dist/**'],
  },
  {
    files: ['**/*.{js,jsx,mjs,ts}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': ['error', { groups: importGroups }],
    },
  },
]
