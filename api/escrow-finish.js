// Serverless API (Vercel) — EscrowFinish
// Entrada: { owner, offerSequence }
// Segurança: Assinar somente no backend usando XRPL_SEED de env/KMS

const { requireAuth } = require('./_auth');
const { getWsUrl } = require('./_xrpl-config');
const { withRetry } = require('./_retry');
const { getDecryptedXRPLSeed } = require('./_kms-adapter');
const { screenPayment } = require('./_screening');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return; // resposta já enviada com erro

    const { owner, offerSequence, fulfillmentHex, policy } = req.body || {};
    let seed;
    try {
      seed = await getDecryptedXRPLSeed();
    } catch (e) {
      return res.status(500).json({ ok: false, error: e && e.message ? e.message : 'KMS adapter error' });
    }
    const wsUrl = getWsUrl();

    if (!owner || typeof offerSequence !== 'number') {
      return res.status(400).json({ ok: false, error: 'Missing owner or offerSequence' });
    }

    const screening = await screenPayment({ type: 'EscrowFinish', owner, offerSequence });
    if (!screening.allowed) {
      return res.status(403).json({ ok: false, error: screening.reason || 'SCREENING_FAILED' });
    }

    let xrpl;
    try {
      xrpl = require('xrpl');
    } catch (e) {
      return res.status(500).json({ ok: false, error: 'Dependency xrpl missing. npm i xrpl' });
    }
    }

    const { enforcePolicy } = require('../src/backend/smart-escrow-policy');

    const client = new xrpl.Client(wsUrl);
    await client.connect();
    try {
      const wallet = xrpl.Wallet.fromSeed(seed);
      const okPolicy = await enforcePolicy(policy, { xrpl, client, screenPayment });
      if (!okPolicy) {
        return res.status(403).json({ ok: false, error: 'SMART_ESCROW_POLICY_BLOCKED' });
      }
      const tx = {
        TransactionType: 'EscrowFinish',
        Account: wallet.address,
        Owner: owner,
        OfferSequence: offerSequence,
        ...(fulfillmentHex && /^[0-9A-Fa-f]+$/.test(fulfillmentHex) ? { Fulfillment: fulfillmentHex.toUpperCase() } : {}),
      };

      const prepared = await client.autofill(tx);
      const signed = wallet.sign(prepared);
      const result = await withRetry(() => client.submitAndWait(signed.tx_blob), {
        retries: 3,
        baseMs: 500,
      });
      const txHash = result.result?.hash || result?.tx_json?.hash;
      const sequence = prepared.Sequence;
      // Auditoria (sem expor segredos)
      try {
        const { logger } = require('./_logger');
        if (logger && typeof logger.logTxAudit === 'function') {
          logger.logTxAudit(txHash || 'unknown', sequence || -1, { type: 'EscrowFinish', owner, account: wallet.address });
        }
      } catch {}

      return res.status(200).json({ ok: true, txHash, sequence });
    } finally {
      await client.disconnect();
    }
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};
