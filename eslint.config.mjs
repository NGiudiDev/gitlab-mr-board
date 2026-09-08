// 2. Dependencias externas.
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const importGroups = [
  // 1. Módulos estándar de Node.js.
  ['^node:', '^\\u0000node:'],
  // 2. Dependencias externas.
  ['^@?\\w', '^\\u0000@?\\w'],
  // 3. Módulos internos con el alias `@/`.
  ['^@/', '^\\u0000@/'],
  // 4. Módulos de constantes.
  ['^(?:@/|\\.{1,2}/)(?:.*/)?constants(?:/.*|\\.[^/]*)?$'],
  // 5. Utilidades.
  ['^(?:@/|\\.{1,2}/)(?:.*/)?utils(?:/.*|\\.[^/]*)?$'],
  // 6. Imports relativos restantes.
  ['^\\.', '^\\u0000\\.'],
  // 7. Hojas de estilo.
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
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
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
