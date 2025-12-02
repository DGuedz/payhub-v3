const { requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res); if (!authUser) return;
  try {
    const valueBRL = Number(req.body && req.body.valueBRL);
    if (!isFinite(valueBRL) || valueBRL <= 0) return res.status(400).json({ ok: false, error: 'InvalidAmount' });
    const pixId = `PIX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const payload = JSON.stringify({ key: 'merchant@payhub', amountBRL: valueBRL.toFixed(2), txid: pixId });
    let qrCodeBase64 = '';
    try { qrCodeBase64 = Buffer.from(payload, 'utf8').toString('base64'); } catch { qrCodeBase64 = payload; }
    const expiresAt = Date.now() + 15 * 60 * 1000;
    return res.json({ ok: true, status: 'pending', pixId, qrCodeBase64, expiresAt });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return res.status(500).json({ ok: false, error: message });
  }
};

