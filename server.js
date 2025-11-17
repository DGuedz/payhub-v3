// Lightweight local server to run Vercel-style API routes for testing via terminal
// Security: never log secrets; relies on env vars set in the shell / .env loader upstream

const http = require('http');
const url = require('url');

// Simple CORS support for frontend->backend integration in dev
// Default allows Vite (5173) and Next.js dev (3001)
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001').split(',').map(s => s.trim());
const ALLOW_ANY = process.env.CORS_ALLOW_ANY === '1';

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOW_ANY || ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', ALLOW_ANY ? '*' : origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true; // handled
  }
  return false;
}

function jsonResponse(res, code, payload) {
  try {
    const body = JSON.stringify(payload || {});
    res.statusCode = code || 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(body);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Internal JSON error' }));
  }
}

function createRes() {
  // Express/Vercel-like minimal wrapper
  return {
    status(code) {
      return {
        json: (obj) => jsonResponse(this._rawRes, code, obj),
      };
    },
    json(obj) { jsonResponse(this._rawRes, 200, obj); },
    _rawRes: null,
  };
}

async function parseJsonBody(rawReq) {
  return new Promise((resolve) => {
    const chunks = [];
    rawReq.on('data', (c) => chunks.push(c));
    rawReq.on('end', () => {
      const buf = Buffer.concat(chunks);
      if (!buf.length) return resolve(undefined);
      try { resolve(JSON.parse(buf.toString('utf8'))); }
      catch { resolve(undefined); }
    });
    rawReq.on('error', () => resolve(undefined));
  });
}

const routes = {
  '/api/health': require('./api/health'),
  '/api/escrow-create': require('./api/escrow-create'),
  '/api/escrow-finish': require('./api/escrow-finish'),
  '/api/trustline-rlusd': require('./api/trustline-rlusd'),
  '/api/xrp-payment': require('./api/xrp-payment'),
  '/api/cross-currency-payment': require('./api/cross-currency-payment'),
  '/api/amm/quote': require('./api/amm-quote'),
  '/api/amm/swap': require('./api/amm-swap'),
  '/api/amm/deposit': require('./api/amm-deposit'),
  '/api/amm/withdraw': require('./api/amm-withdraw'),
  '/api/v1/sdk_p4yhu3/liquidar-parcelado': require('./api/v1/sdk_p4yhu3/liquidar-parcelado'),
  // Rotas v1 desabilitadas temporariamente para focar na integração ODL mínima
  // '/api/v1/sdk_p4yhu3/liquidar-parcelado': require('./api/v1/sdk_p4yhu3/liquidar-parcelado'),
  // '/api/v1/sdk_p4yhu3/antecipar-escrow': require('./api/v1/sdk_p4yhu3/antecipar-escrow'),
  '/api/v1/merchant/yield/activate': require('./api/v1/merchant/yield/activate'),
  '/api/identity/xumm/start': require('./api/identity/xumm/start'),
  '/api/identity/xumm/callback': require('./api/identity/xumm/callback'),
  // '/api/v1/compliance/report': require('./api/v1/compliance/report'),
  // '/api/v1/connect/erp/reconcile': require('./api/v1/connect/erp/reconcile'),
};

const server = http.createServer(async (req, res) => {
  // CORS preflight and headers
  if (applyCors(req, res)) return;
  const parsed = url.parse(req.url, true);
  const handler = routes[parsed.pathname];
  if (!handler) {
    return jsonResponse(res, 404, { ok: false, error: 'Not Found' });
  }

  const resWrap = createRes();
  resWrap._rawRes = res;

  // Build minimal req object expected by handlers
  const reqWrap = {
    method: req.method,
    headers: req.headers,
    query: parsed.query,
    body: undefined,
  };

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    reqWrap.body = await parseJsonBody(req);
  }

  try {
    const result = handler(reqWrap, resWrap);
    if (result && typeof result.then === 'function') {
      await result;
    }
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    jsonResponse(res, 500, { ok: false, error: message });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(port, () => {
  console.log(JSON.stringify({ msg: 'Local API server listening', port }));
});
