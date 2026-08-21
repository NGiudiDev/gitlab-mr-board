import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import config from './config.js';

import mergeRequestsRouter from './routes/mergeRequests.js';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', projects: config.projectIds.length });
});

app.use('/api', mergeRequestsRouter);

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error('Error no controlado:', error);
  response.status(500).json({ error: 'Error interno del servidor.' });
};

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend disponible en http://localhost:${config.port}`);
  console.log(`Monitoreando ${config.projectIds.length} proyectos: ${config.projectIds.join(', ')}`);
});
