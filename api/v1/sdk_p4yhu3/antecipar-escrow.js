// Endpoint: POST /api/v1/sdk_p4yhu3/antecipar-escrow
// CapitalService (V2): envia Payment de 95% RLUSD ao comerciante (D+0)
// Proteção: JWT obrigatório; assinatura somente no backend via XRPL_SEED_FUNDING

const { requireAuth } = require('../../_auth');
const { getWsUrl } = require('../../_xrpl-config');
const { withRetry } = require('../../_retry');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return; // resposta já enviada

    const { merchantWallet, value, owner, offerSequence } = req.body || {};
    const issuer = process.env.RLUSD_ISSUER_ADDRESS;
    const seedFunding = process.env.XRPL_SEED_FUNDING || process.env.XRPL_SEED;
    const treasuryVault = process.env.TREASURY_VAULT_ADDRESS;
    const wsUrl = getWsUrl();

    if (!issuer || !seedFunding) {
      return res.status(400).json({ ok: false, error: 'Missing issuer or funding seed envs' });
    }
    if (!merchantWallet || !value) {
      return res.status(400).json({ ok: false, error: 'Missing merchantWallet or value' });
    }

    let xrpl;
    try {
      xrpl = require('xrpl');
    } catch (e) {
      return res.status(500).json({ ok: false, error: 'Dependency xrpl missing. npm i xrpl' });
    }

    const client = new xrpl.Client(wsUrl);
    await client.connect();
    try {
      // Opcional: validar existência do Escrow (owner, offerSequence) e destino = treasuryVault
      if (owner && typeof offerSequence === 'number' && treasuryVault) {
        try {
          const objs = await client.request({
            command: 'account_objects',
            account: owner,
            type: 'escrow',
            ledger_index: 'validated',
          });
          const found = (objs.result.objects || []).find((o) => o.OfferSequence === offerSequence);
          if (!found) {
            return res.status(404).json({ ok: false, error: 'Escrow not found for owner/offerSequence' });
          }
          if (found.Destination && treasuryVault && found.Destination !== treasuryVault) {
            return res.status(400).json({ ok: false, error: 'Escrow destination is not treasury vault (V2 required)' });
          }
        } catch (e) {
          // Continua sem bloquear, apenas registra auditoria depois
        }
      }

      const wallet = xrpl.Wallet.fromSeed(seedFunding);
      const financed = (Number(value) * 0.95).toFixed(2);
      const amount = { currency: 'RLUSD', issuer, value: String(financed) };

      const tx = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: merchantWallet,
        Amount: amount,
      };

      const prepared = await client.autofill(tx);
      const sequence = prepared.Sequence;
      const signed = wallet.sign(prepared);
      const result = await withRetry(() => client.submitAndWait(signed.tx_blob), {
        retries: 3,
        baseMs: 500,
      });
      const txHash = result.result?.hash || result?.tx_json?.hash;

      // Auditoria
      try {
        const { logger } = require('../../_logger');
        if (logger && typeof logger.logTxAudit === 'function') {
          logger.logTxAudit(txHash || 'unknown', sequence || -1, { type: 'Payment', purpose: 'ADVANCE_95', destination: merchantWallet });
        }
      } catch {}

      return res.status(200).json({ ok: true, txHash, sequence, financedAmount: financed });
    } finally {
      await client.disconnect();
    }
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};