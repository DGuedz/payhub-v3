const { requireAuth } = require('../../_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  try {
    const { operationId, txs } = req.body || {};
    if (!operationId || !Array.isArray(txs)) return res.status(400).json({ ok: false, error: 'Missing operationId or txs[]' });
    const timestamp = new Date().toISOString();
    try {
      const { logger } = require('../../_logger');
      if (logger && typeof logger.info === 'function') logger.info('ERP reconcile request', { operationId, count: txs.length });
    } catch {}
    return res.status(200).json({ ok: true, operationId, reconciled: txs.map((h) => ({ txHash: String(h), status: 'ACK' })), timestamp });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return res.status(500).json({ ok: false, error: message });
  }
};
