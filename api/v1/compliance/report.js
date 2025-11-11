// Endpoint: GET /api/v1/compliance/report
// Objetivo: Exportar relatório de compliance (CSV mock) com auditoria de tx (sem PII)
// Segurança: JWT obrigatório; logs padronizados

const { requireAuth } = require('../../_auth');
const { logger } = require('../../_logger');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return; // resposta já enviada

    // CSV mock — Em produção, agregará dados on-chain e ERP
    const csv = [
      'operation_id,tx_hash,status,timestamp',
      `PAYHUB-TX-${Date.now()},TX-MOCK-123,IN_ESCROW,${new Date().toISOString()}`,
    ].join('\n');

    try {
      logger.audit('[P4YHU3-COMPLIANCE] Export CSV', { rows: 1 });
    } catch {}

    // Como o servidor simplifica em JSON, retornamos o CSV dentro de JSON
    return res.status(200).json({ ok: true, format: 'csv', content: csv });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};