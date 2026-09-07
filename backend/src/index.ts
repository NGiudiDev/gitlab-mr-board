// 7. Imports relativos restantes.
import { createApp } from './app.js';
import config from './config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Backend disponible en http://localhost:${config.port}`);
  console.log(`Instancia de GitLab: ${config.gitlabBaseUrl}`);
  console.log('Cada persona configura sus proyectos y su access token desde «Mi cuenta».');
});
