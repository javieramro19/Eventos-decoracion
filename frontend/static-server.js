const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.FRONTEND_PORT || 4300);
const host = process.env.FRONTEND_HOST || '127.0.0.1';
const distDir = path.join(__dirname, 'dist', 'frontend');
const indexFile = path.join(distDir, 'index.html');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const cacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
};

const sendFile = (res, filePath) => {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('No se pudo servir el frontend.');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      ...cacheHeaders,
    });
    res.end(data);
  });
};

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const cleanPath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  const targetPath = path.join(distDir, cleanPath === '/' ? 'index.html' : cleanPath);

  if (!targetPath.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Ruta no permitida.');
    return;
  }

  fs.stat(targetPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(res, targetPath);
      return;
    }

    sendFile(res, indexFile);
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${host}:${port} ya esta ocupado.`);
    console.error('Cierra el proceso anterior o arranca con otro puerto: $env:FRONTEND_PORT=4201; npm start');
    process.exit(1);
  }

  console.error('No se pudo iniciar el frontend:', error.message);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`Frontend disponible en http://${host}:${port}`);
});
