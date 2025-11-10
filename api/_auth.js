// Middleware de autenticação JWT para rotas críticas
const jwt = require('jsonwebtoken');
// Cache simples de JWT curtos para reduzir latência (memória local, TTL curto)
const jwtCache = new Map();
function getCacheTtlMs() {
  const v = Number(process.env.JWT_CACHE_TTL_MS || '60000');
  return Number.isFinite(v) && v > 0 ? v : 60000;
}

function requireAuth(req, res) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    res.status(401).json({ ok: false, error: 'Missing JWT' });
    return null;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ ok: false, error: 'Missing JWT_SECRET env' });
    return null;
  }
  try {
    // Cache lookup
    const now = Date.now();
    const cached = jwtCache.get(token);
    if (cached && cached.expiresAt > now) {
      return cached.decoded;
    }
    const issuer = process.env.JWT_ISSUER;
    const options = {};
    if (issuer) options.issuer = issuer;
    if (process.env.JWT_MAX_AGE) options.maxAge = process.env.JWT_MAX_AGE;
    const decoded = jwt.verify(token, secret, options);
    // Cache store (TTL curto)
    const ttl = getCacheTtlMs();
    jwtCache.set(token, { decoded, expiresAt: now + ttl });
    return decoded;
  } catch (err) {
    res.status(401).json({ ok: false, error: 'Invalid or expired JWT' });
    return null;
  }
}

module.exports = { requireAuth };