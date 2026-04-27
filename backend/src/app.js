require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const db = require('./db/connection');
const { initDatabase } = require('./db/init');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const shouldLogRequests = String(process.env.LOG_REQUESTS || '').toLowerCase() === 'true';

const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  const clone = Array.isArray(body) ? [...body] : { ...body };
  const sensitiveKeys = ['password', 'token'];
  for (const key of sensitiveKeys) {
    if (key in clone) clone[key] = '***';
  }
  return clone;
};

const sanitizeAuthHeader = (value) => {
  if (!value || typeof value !== 'string') return value;
  if (value.toLowerCase().startsWith('bearer ')) return 'Bearer ***';
  return '***';
};

if (shouldLogRequests) {
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      console.log('[req]', req.method, req.originalUrl, res.statusCode, `${durationMs.toFixed(1)}ms`, {
        query: req.query,
        params: req.params,
        body: sanitizeBody(req.body),
        auth: sanitizeAuthHeader(req.get('Authorization')),
        user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      });
    });

    next();
  });
}

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/events', require('./routes/events.routes'));

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 as result');
    res.json({
      status: 'Servidor arriba',
      db: 'Conectada',
      test: rows[0].result,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el backend:', error.message || error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
