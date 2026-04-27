const mysql = require('mysql2');
require('dotenv').config();

//create a connection pool to the MySQL database using environment variables for configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//export the promise-based pool for use in other parts of the application
const db = pool.promise();

const shouldLogQueries =
  String(process.env.DB_LOG_QUERIES || '').toLowerCase() === 'true';

const maskParam = (value) => {
  if (typeof value !== 'string') return value;
  if (value.startsWith('$2') && value.length > 20) return '$2***';
  if (value.split('.').length === 3 && value.length > 20) return '***JWT***';
  if (value.length > 120) return `${value.slice(0, 117)}...`;
  return value;
};

const withQueryLogging = (targetDb) =>
  new Proxy(targetDb, {
    get(target, prop) {
      const original = target[prop];
      if (prop !== 'query' && prop !== 'execute') return original;
      if (typeof original !== 'function') return original;

      return async (sql, params, ...rest) => {
        const start = process.hrtime.bigint();
        try {
          const result = await original.call(target, sql, params, ...rest);
          const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
          const safeParams = Array.isArray(params)
            ? params.map(maskParam)
            : params;
          console.log(
            `[db] ${prop} ${durationMs.toFixed(1)}ms :: ${sql}`,
            safeParams !== undefined ? safeParams : ''
          );
          return result;
        } catch (err) {
          const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
          const safeParams = Array.isArray(params)
            ? params.map(maskParam)
            : params;
          console.error(
            `[db] ${prop} ERROR ${durationMs.toFixed(1)}ms :: ${sql}`,
            safeParams !== undefined ? safeParams : ''
          );
          throw err;
        }
      };
    },
  });

// test the database connection by getting a connection from the pool and releasing it immediately
pool.getConnection((err, connection) => {
    if (err) {
        console.error('ERROR conectando a la base de datos', err.message);
    } else {
        console.log('Conexión a MySQL correcta!');
        connection.release();
    }
});

// export the database connection for use in other modules
module.exports = shouldLogQueries ? withQueryLogging(db) : db;
