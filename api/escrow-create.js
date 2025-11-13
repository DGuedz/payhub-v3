// Serverless API (Vercel) — EscrowCreate para RLUSD (IOU)
// Segurança: Assinar somente no backend usando XRPL_SEED de env/KMS

const { requireAuth } = require('./_auth');
const { getWsUrl } = require('./_xrpl-config');
const { withRetry } = require('./_retry');
const { screenPayment } = require('./_screening');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return; // resposta já enviada com erro

    const { value, finishAfterUnix } = req.body || {};
    const issuer = process.env.RLUSD_ISSUER_ADDRESS;
    const seed = process.env.XRPL_SEED;
    const treasuryVault = process.env.TREASURY_VAULT_ADDRESS;
    const wsUrl = getWsUrl();

    if (!issuer || !seed || !treasuryVault) {
      return res.status(400).json({ ok: false, error: 'Missing issuer, seed or treasuryVault envs' });
    }
    if (!value) {
      return res.status(400).json({ ok: false, error: 'Missing value' });
    }

    const screening = await screenPayment({ type: 'EscrowCreate', currency: 'RLUSD', value, issuer });
    if (!screening.allowed) {
      return res.status(403).json({ ok: false, error: screening.reason || 'SCREENING_FAILED' });
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
      const amount = { currency: 'RLUSD', issuer, value: String(value) };
      const tx = {
        TransactionType: 'EscrowCreate',
        Account: wallet.address,
        Destination: treasuryVault, // V2: Escrow como colateral; destino é a vault do financiador
        Amount: amount,
        ...(finishAfterUnix ? { FinishAfter: finishAfterUnix } : {}),
      };

      const prepared = await client.autofill(tx);
      const offerSequence = prepared.Sequence;
      const signed = wallet.sign(prepared);
      const result = await withRetry(() => client.submitAndWait(signed.tx_blob), {
        retries: 3,
        baseMs: 500,
      });
      const txHash = result.result?.hash || result?.tx_json?.hash;
      // Auditoria (sem expor segredos)
      try {
        const { logger } = require('./_logger');
        if (logger && typeof logger.logTxAudit === 'function') {
          logger.logTxAudit(txHash || 'unknown', offerSequence || -1, { type: 'EscrowCreate', owner: wallet.address, destination: treasuryVault, purpose: 'COLLATERAL' });
        }
      } catch {}

      return res.status(200).json({ ok: true, txHash, offerSequence });
    } finally {
      await client.disconnect();
    }
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};