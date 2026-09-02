import { createApp } from './app.js';
import config from './config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Backend disponible en http://localhost:${config.port}`);
  console.log(`Monitoreando ${config.projectIds.length} proyectos: ${config.projectIds.join(', ')}`);
});
