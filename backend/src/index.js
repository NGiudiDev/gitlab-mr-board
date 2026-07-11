const express = require('express');
const cors = require('cors');
const config = require('./config');
const mergeRequestsRouter = require('./routes/mergeRequests');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', projects: config.projectIds.length });
});

app.use('/api', mergeRequestsRouter);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
  console.log(`Tracking ${config.projectIds.length} projects: ${config.projectIds.join(', ')}`);
});
