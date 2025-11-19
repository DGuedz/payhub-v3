// Serverless API (Vercel) — Trustline RLUSD
// Entrada: { limit } — valor máximo da trustline (string, ex: "1000")
// Segurança: Assinar somente no backend usando XRPL_SEED de env/KMS

const { requireAuth } = require('./_auth');
const { getWsUrl } = require('./_xrpl-config');
const { withRetry } = require('./_retry');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return; // resposta já enviada com erro

    const { limit } = req.body || {};
    const seed = process.env.XRPL_SEED;
    const issuer = process.env.RLUSD_ISSUER_ADDRESS;
    const wsUrl = getWsUrl();

    if (!seed) {
      return res.status(400).json({ ok: false, error: 'Missing XRPL_SEED env' });
    }
    if (!issuer) {
      return res.status(400).json({ ok: false, error: 'Missing RLUSD_ISSUER_ADDRESS env' });
    }
    if (typeof limit !== 'string' || !limit) {
      return res.status(400).json({ ok: false, error: 'Missing limit string' });
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
      const wallet = xrpl.Wallet.fromSeed(seed);
      const tx = {
        TransactionType: 'TrustSet',
        Account: wallet.address,
        LimitAmount: {
          currency: 'RLUSD',
          issuer,
          value: limit,
        },
      };

      const prepared = await client.autofill(tx);
      const signed = wallet.sign(prepared);
      const result = await withRetry(() => client.submitAndWait(signed.tx_blob), {
        retries: 3,
        baseMs: 500,
      });
      const txHash = result.result?.hash || result?.tx_json?.hash;
      const sequence = prepared.Sequence;

      // Auditoria
      try {
        const { logger } = require('./_logger');
        if (logger && typeof logger.logTxAudit === 'function') {
          logger.logTxAudit(txHash || 'unknown', sequence || -1, { type: 'TrustSet', account: wallet.address, issuer, currency: 'RLUSD', limit });
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