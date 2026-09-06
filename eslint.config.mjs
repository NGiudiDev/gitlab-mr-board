import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import { importX } from 'eslint-plugin-import-x'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const importGroups = [
  // 1. Módulos estándar de Node.js.
  ['^node:', '^\\u0000node:'],
  // 2. Dependencias externas.
  ['^@?\\w', '^\\u0000@?\\w'],
  // 3. Módulos internos con el alias `@/`.
  ['^@/', '^\\u0000@/'],
  // 4. Imports exclusivos de tipos de TypeScript.
  ['^.+\\u0000$'],
  // 5. Módulos de constantes.
  ['^(?:@/|\\.{1,2}/)(?:.*/)?constants(?:/.*|\\.[^/]*)?$'],
  // 6. Utilidades.
  ['^(?:@/|\\.{1,2}/)(?:.*/)?utils(?:/.*|\\.[^/]*)?$'],
  // 7. Imports relativos restantes.
  ['^\\.', '^\\u0000\\.'],
  // 8. Hojas de estilo.
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
  {
    files: ['backend/**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'import-x': importX,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'separate-type-imports',
          prefer: 'type-imports',
        },
      ],
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    },
  },
]
