const jwt = require('jsonwebtoken');

const ADMIN_EMAIL = 'admin@gmail.com';

const isAdminUser = (user = {}) =>
  user.role === 'admin' || String(user.email || '').toLowerCase() === ADMIN_EMAIL;

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const raw = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : authHeader.trim();

    const decoded = jwt.verify(raw, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado, inicia sesión de nuevo' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

exports.adminOnlyMiddleware = (req, res, next) => {
  if (!isAdminUser(req.user)) {
    return res.status(403).json({ error: 'Solo el administrador puede acceder a este entorno' });
  }

  next();
};

exports.isAdminUser = isAdminUser;
