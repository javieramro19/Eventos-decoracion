const jwt = require('jsonwebtoken');

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
