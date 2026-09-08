// 2. Dependencias externas.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    setupFiles: ['./test/setup.js'],
    // El primer test de cada archivo que use la base paga el arranque de
    // PGlite —compilar el WebAssembly de Postgres— y la aplicación del
    // esquema, que con varios workers en paralelo superan holgadamente los
    // límites por omisión. El de los hooks va aparte: casi todos los archivos
    // abren la base en un `beforeEach`.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Incluye los módulos sin test para que la cobertura refleje todo el
      // código de producción, no sólo el que ya está cubierto.
      include: ['src/**/*.js'],
      // `src/scripts/` son herramientas de operación por línea de comandos, no
      // código servido por la API.
      exclude: ['src/**/*.test.js', 'src/scripts/**'],
    },
  },
});
