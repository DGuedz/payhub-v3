// Endpoint: POST /api/v1/connect/erp/reconcile
// Objetivo: Integração ERP de reconciliação (mock), garantindo JWT e auditoria
// Segurança: JWT obrigatório; logs padronizados; sem PII

const { requireAuth } = require('../../_auth');
const { logger } = require('../../_logger');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return; // resposta já enviada

    const { periodStart, periodEnd } = req.body || {};
    if (!periodStart || !periodEnd) {
      return res.status(400).json({ ok: false, error: 'Missing periodStart/periodEnd' });
    }

    const reconcileId = `RECON-${Date.now()}`;
    const entries = [
      { operationId: `PAYHUB-TX-${Date.now()}`, status: 'SETTLED', txHash: 'TX-MOCK-123' },
    ];

    try {
      logger.audit('[P4YHU3-ERP] Reconcile', { reconcileId, periodStart, periodEnd, entries: entries.length });
    } catch {}

    return res.status(200).json({ ok: true, reconcileId, entries });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};