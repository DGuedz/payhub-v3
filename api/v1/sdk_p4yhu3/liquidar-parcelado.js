const { requireAuth } = require('../../_auth');
const { solicitarFinanciamento, cancelarFinanciamento } = require('../../../src/backend/sdk/capital-service');
const { criarEscrow, submeterTransacao } = require('../../../src/backend/sdk/assurance-service');
const { logarOperacao } = require('../../../src/backend/sdk/reporting-service');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  try {
    const body = req.body || {};
    const valorBrL = Number(body.valor_brl || body.valor || 0);
    const parcelas = Number(body.parcelas || 0);
    const recebedorWallet = String(body.recebedor_wallet || '').trim();
    const provaServicoId = String(body.prova_servico_id || '').trim();
    if (!valorBrL || !recebedorWallet) {
      return res.status(400).json({ ok: false, error: 'Missing valor_brl or recebedor_wallet' });
    }
    const rcvId = `RCV-${Date.now()}-${parcelas || 1}`;
    let funding;
    let escrowCreate;
    let submitRes;
    try {
      funding = solicitarFinanciamento(rcvId, valorBrL);
      escrowCreate = criarEscrow(funding, recebedorWallet, provaServicoId);
      submitRes = submeterTransacao(escrowCreate.signedTxBlob);
    } catch (e) {
      try { if (funding && funding.fundingId) cancelarFinanciamento(funding.fundingId); } catch {}
      const message = e && e.message ? e.message : String(e);
      return res.status(500).json({ ok: false, error: message });
    }
    const report = logarOperacao(submitRes.txHash, recebedorWallet, 'IN_ESCROW');
    return res.status(200).json({ ok: true, operationId: report.operationId, fundingId: funding.fundingId, escrow: { txHash: submitRes.txHash, offerSequence: submitRes.offerSequence, owner: recebedorWallet } });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};

