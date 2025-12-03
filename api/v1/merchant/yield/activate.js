const { requireAuth } = require('../../../_auth');
const { logger } = require('../../../_logger');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  try {
    const body = req.body || {};
    const merchantId = String(body.merchantId || body.account || '').trim();
    if (!merchantId) return res.status(400).json({ ok: false, error: 'Missing merchantId' });
    const activationId = 'YIELD-' + merchantId + '-' + Date.now();
    try { logger.info('Yield activate', { activationId, merchantId }); } catch {}
    return res.status(200).json({ ok: true, activationId, status: 'PENDING_ACTIVATION' });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return res.status(500).json({ ok: false, error: message });
  }
};
