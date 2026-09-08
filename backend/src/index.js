// 6. Imports relativos restantes.
import { createApp, createServices } from './app.js';
import config from './config.js';
import { applySchema, createNeonDatabase } from './shared/database.js';

/**
 * Abre la base, deja el esquema aplicado y recién entonces atiende pedidos.
 *
 * A diferencia de SQLite, la base es remota: si no está disponible conviene no
 * arrancar, en lugar de responder errores a cada consulta.
 */
async function main() {
  const database = createNeonDatabase(config.databaseUrl);

  await applySchema(database);

  const app = createApp(createServices(database));

  app.listen(config.port, () => {
    console.log(`Backend disponible en http://localhost:${config.port}`);
    console.log(`Instancia de GitLab: ${config.gitlabBaseUrl}`);
    console.log('Cada cuenta configura sus proyectos y su access token desde «Mi cuenta»; los carga un administrador para todo el equipo.');
  });
}

main().catch((error) => {
  console.error('No se pudo iniciar el backend:', error);
  console.error('Revisá DATABASE_URL y que la base de Neon esté disponible.');
  process.exitCode = 1;
});
