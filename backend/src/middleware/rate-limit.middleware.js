const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 10;

const buckets = new Map();

const cleanupExpiredBuckets = (now) => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

const getClientIp = (req) => {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
};

const publicRateLimit = (req, res, next) => {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = `${getClientIp(req)}:${req.baseUrl || req.path}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.set('Retry-After', retryAfterSeconds.toString());
    return res.status(429).json({
      error: 'Has superado el limite de 10 solicitudes por hora para esta ruta publica',
    });
  }

  current.count += 1;
  next();
};

module.exports = { publicRateLimit };
