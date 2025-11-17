const { requireAuth } = require('./_auth');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  try {
    const { poolCurrency, poolIssuer, amountA, amountB } = req.body || {};
    if (!poolCurrency || !poolIssuer || (!amountA && !amountB)) return res.status(400).json({ ok: false, error: 'Missing pool/amounts' });
    const timestamp = new Date().toISOString();
    return res.status(200).json({ ok: true, accepted: true, pool: { currency: poolCurrency, issuer: poolIssuer }, amounts: { amountA, amountB }, timestamp });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return res.status(500).json({ ok: false, error: message });
  }
};

