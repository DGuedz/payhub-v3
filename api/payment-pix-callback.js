const { requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res); if (!authUser) return;
  try {
    const { pixId, valueBRL } = req.body || {};
    if (!pixId) return res.status(400).json({ ok: false, error: 'Missing pixId' });
    const amountBRL = Number(valueBRL);
    if (!isFinite(amountBRL) || amountBRL <= 0) return res.status(400).json({ ok: false, error: 'InvalidAmount' });

    const baseUrl = `http://localhost:${process.env.PORT ? Number(process.env.PORT) : 3000}`;
    const headers = { 'Content-Type': 'application/json' };
    if (req.headers && req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const valueRLUSD = (amountBRL / 5.0).toFixed(2);

    let fetchFn = global.fetch;
    if (typeof fetchFn !== 'function') {
      try { fetchFn = require('node-fetch'); } catch { fetchFn = null; }
    }
    if (!fetchFn) return res.status(500).json({ ok: false, error: 'Fetch unavailable' });

    const createRes = await fetchFn(`${baseUrl}/api/escrow-create`, { method: 'POST', headers, body: JSON.stringify({ value: valueRLUSD }) });
    const createJson = await createRes.json().catch(() => null);
    if (!createRes.ok) return res.status(500).json({ ok: false, error: createJson?.error || 'ESCROW_CREATE_FAILED', step: 'create' });

    const offerSequence = Number(createJson?.offerSequence);
    const owner = String(createJson?.owner || '');
    const createHash = String(createJson?.txHash || '');

    await new Promise((r) => setTimeout(r, 2000));

    const finishRes = await fetchFn(`${baseUrl}/api/escrow-finish`, { method: 'POST', headers, body: JSON.stringify({ owner, offerSequence }) });
    const finishJson = await finishRes.json().catch(() => null);
    if (!finishRes.ok) return res.status(500).json({ ok: false, error: finishJson?.error || 'ESCROW_FINISH_FAILED', step: 'finish', offerSequence, owner });

    const finishHash = String(finishJson?.txHash || '');
    const sequence = Number(finishJson?.sequence);

    return res.json({ ok: true, status: 'settled', pixId, createHash, offerSequence, owner, finishHash, sequence });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return res.status(500).json({ ok: false, error: message });
  }
};

