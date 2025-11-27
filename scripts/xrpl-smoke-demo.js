const fs = require('fs');

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const outputFile = process.env.OUTPUT_FILE || 'docs/ARTIFACTS_DEVNET.json';
  const jwtSecret = process.env.JWT_SECRET || '';

  async function signToken() {
    try {
      const jwt = require('jsonwebtoken');
      return jwt.sign({ sub: 'demo', iat: Math.floor(Date.now() / 1000) }, jwtSecret || 'demo-secret', { expiresIn: '10m' });
    } catch {
      return '';
    }
  }

  const token = await signToken();
  const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  async function post(path, body) {
    const res = await fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body || {}) });
    const txt = await res.text();
    let json; try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  }

  async function get(path) {
    const res = await fetch(`${baseUrl}${path}`, { method: 'GET', headers });
    const txt = await res.text();
    let json; try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  }

  let artifacts = {};
  try {
    const tl = await post('/api/trustline-rlusd', { limit: '1000' });
    artifacts.trustline = tl;
  } catch {}

  let owner;
  let offerSequence;
  try {
    const cr = await post('/api/escrow-create', { value: '100.00' });
    artifacts.escrowCreate = cr;
    owner = cr.owner || cr.account;
    offerSequence = cr.offerSequence;
  } catch {}

  try {
    if (owner && typeof offerSequence === 'number') {
      const fn = await post('/api/escrow-finish', { owner, offerSequence });
      artifacts.escrowFinish = fn;
    }
  } catch {}

  if (!artifacts.trustline || !artifacts.escrowCreate || !artifacts.escrowFinish) {
    const sim = await post('/api/simulate/escrow-e2e', { value: '100.00', merchantWallet: 'rMERCHANT_SIM' });
    artifacts = sim.artifacts || artifacts;
    artifacts.simulated = true;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    artifacts,
  };
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2));
  const report = await get('/api/v1/compliance/report');
  const finalPayload = { ...payload, report };
  fs.writeFileSync(outputFile, JSON.stringify(finalPayload, null, 2));
  process.stdout.write(JSON.stringify({ ok: true, outputFile }));
}

main().catch((e) => {
  process.stderr.write(String(e && e.message ? e.message : e));
  process.exit(1);
});
