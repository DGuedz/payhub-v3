// Endpoint de orquestração: POST /api/v1/sdk_p4yhu3/liquidar-parcelado
// Fluxo: Capital -> Assurance (sign) -> Rails (submit) -> Reporting
// Segurança: JWT obrigatório; sem exposição de segredos

const { requireAuth } = require('../../_auth');
const { logger } = require('../../_logger');
const { GatewayService } = require('../../../src/backend/lib/sdk/gateway-service');
const { CapitalService } = require('../../../src/backend/lib/sdk/capital-service');
const { AssuranceService } = require('../../../src/backend/lib/sdk/assurance-service');
const { ReportingService } = require('../../../src/backend/lib/sdk/reporting-service');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return; // resposta já enviada

    // Validação inicial
    const input = await GatewayService.validarEntrada(req.body || {});

    const rcvId = `RCV-ID-PAYHUB-${Date.now()}`;
    let funding, signedTxBlob, submitResult, report;

    try {
      // Passo 1: Financiamento (Hidden Road)
      funding = await CapitalService.solicitarFinanciamento(rcvId, input.valor_brl);

      // Passo 2: Assinatura (Metaco)
      signedTxBlob = await AssuranceService.criarEscrow(
        funding,
        input.recebedor_wallet,
        input.prova_servico_id
      );

      // Passo 3: Submissão (Rails/XRPL)
      submitResult = await AssuranceService.submeterTransacao(signedTxBlob);

      // Passo 4: Reporting (GTreasury)
      report = await ReportingService.logarOperacao(
        submitResult.txHash,
        input.recebedor_wallet,
        'IN_ESCROW'
      );
    } catch (stepErr) {
      // Rollback: cancelar financiamento se falha após Passo 1
      if (funding && funding.fundingId) {
        try { await CapitalService.cancelarFinanciamento(funding.fundingId); } catch {}
      }
      logger.error('[P4YHU3-SDK] Orquestração FAIL', { error: stepErr.message });
      return res.status(500).json({ ok: false, error: stepErr.message });
    }

    // Auditoria final
    try {
      if (submitResult && submitResult.txHash) {
        logger.audit('[P4YHU3-SDK] Operação concluída', { txHash: submitResult.txHash, operationId: report.id });
      }
    } catch {}

    return res.status(200).json({ status: 'success', operationId: report.id, txHash: submitResult.txHash });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};