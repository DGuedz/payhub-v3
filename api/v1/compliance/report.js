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

    let csv;
    try {
      const fs = require('fs');
      const isTestnet = String(process.env.XRPL_NETWORK || '').toLowerCase() === 'testnet';
      const artifactsPath = isTestnet ? 'docs/testnet-audit/artifacts.json' : 'docs/ARTIFACTS_DEVNET.json';
      if (fs.existsSync(artifactsPath)) {
        const data = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
        const a = data.artifacts || {};
        const explorerBase = isTestnet ? 'https://testnet.xrpl.org/transactions/' : 'https://devnet.xrpl.org/transactions/';
        const lines = ['operation,tx_hash,sequence,owner,offer_sequence,destination,amount_currency,amount_value,amount_issuer,status,timestamp,explorer_url'];
        if (a.trustline) lines.push(`TRUSTLINE,${a.trustline.txHash || ''},${a.trustline.sequence || ''},,,,RLUSD,,${process.env.RLUSD_ISSUER_ADDRESS || a.rlusdIssuer || ''},${a.trustline.status || ''},${new Date().toISOString()},${explorerBase}${a.trustline.txHash || ''}`);
        if (a.escrowCreate) lines.push(`ESCROW_CREATE,${a.escrowCreate.txHash || ''},${a.escrowCreate.offerSequence || ''},${a.escrowCreate.owner || ''},${a.escrowCreate.offerSequence || ''},${a.escrowCreate.destination || ''},RLUSD,${a.escrowCreate.amount?.value || ''},${a.escrowCreate.amount?.issuer || a.rlusdIssuer || ''},CREATED,${new Date().toISOString()},${explorerBase}${a.escrowCreate.txHash || ''}`);
        if (a.advance95) lines.push(`ADVANCE_95,${a.advance95.txHash || ''},${a.advance95.sequence || ''},,,${a.advance95.destination || ''},RLUSD,${a.advance95.financedAmount || ''},${process.env.RLUSD_ISSUER_ADDRESS || a.rlusdIssuer || ''},PAID,${new Date().toISOString()},${explorerBase}${a.advance95.txHash || ''}`);
        if (a.escrowFinish) lines.push(`ESCROW_FINISH,${a.escrowFinish.txHash || ''},${a.escrowFinish.sequence || ''},${a.escrowFinish.owner || ''},${a.escrowFinish.offerSequence || ''},,,RLUSD,0,FINISHED,${new Date().toISOString()},${explorerBase}${a.escrowFinish.txHash || ''}`);
        csv = lines.join('\n');
      }
    } catch {}
    if (!csv) {
      csv = [
        'operation_id,tx_hash,status,timestamp',
        `PAYHUB-TX-${Date.now()},TX-MOCK-123,IN_ESCROW,${new Date().toISOString()}`,
      ].join('\n');
    }

    try {
      logger.audit('[P4YHU3-COMPLIANCE] Export CSV', { rows: 1 });
    } catch {}

    return res.status(200).json({ ok: true, format: 'csv', content: csv });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};
