// Endpoint: POST /api/v1/merchant/yield/activate
// Objetivo: Stub para ativação de Yield (XRPL EVM Sidechain / mXRP)
// Segurança: JWT obrigatório; logs padronizados; sem segredos

const { requireAuth } = require('../../_auth');
const { logger } = require('../../_logger');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return; // resposta já enviada

    const { merchantAccount, targetApy } = req.body || {};
    if (!merchantAccount) {
      return res.status(400).json({ ok: false, error: 'Missing merchantAccount' });
    }

    // Stub: Em produção, acoplar motor de yield na XRPL EVM Sidechain
    const activationId = `YIELD-ACT-${Date.now()}`;
    try {
      logger.audit('[P4YHU3-YIELD] Ativação solicitada', {
        activationId,
        merchantAccount,
        targetApy: targetApy || '5-8% APY',
      });
    } catch {}

    return res.status(200).json({ ok: true, activationId, status: 'PENDING_ACTIVATION' });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};