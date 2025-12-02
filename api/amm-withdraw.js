const { requireAuth } = require('./_auth');
const { getWsUrl } = require('./_xrpl-config');
const { withRetry } = require('./_retry');
const { getDecryptedXRPLSeed } = require('./_kms-adapter');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  try {
    const { poolCurrency, poolIssuer, lpTokenAmount } = req.body || {};
    if (!poolCurrency || !poolIssuer || !lpTokenAmount) return res.status(400).json({ ok: false, error: 'Missing pool or lpTokenAmount' });
    const execEnabled = String(process.env.AMM_EXECUTE || '0') === '1';
    let txHash = null;
    let sequence = -1;
    if (execEnabled) {
      let seed; try { seed = await getDecryptedXRPLSeed(); } catch (e) { return res.status(500).json({ ok: false, error: e && e.message ? e.message : 'KMS adapter error' }); }
      let xrpl; try { xrpl = require('xrpl'); } catch (e) { return res.status(500).json({ ok: false, error: 'Dependency xrpl missing. npm i xrpl' }); }
      const wsUrl = getWsUrl();
      const client = new xrpl.Client(wsUrl);
      await client.connect();
      try {
        const wallet = xrpl.Wallet.fromSeed(seed);
        const lpTokenObj = { currency: String(poolCurrency).toUpperCase(), issuer: poolIssuer, value: String(lpTokenAmount) };
        const tx = { TransactionType: 'AMMWithdraw', Account: wallet.address, Amount: lpTokenObj };
        const prepared = await client.autofill(tx);
        sequence = prepared.Sequence;
        const signed = wallet.sign(prepared);
        const result = await withRetry(() => client.submitAndWait(signed.tx_blob), { retries: 3, baseMs: 500 });
        txHash = result.result?.hash || result?.tx_json?.hash || null;
      } finally {
        try { await client.disconnect(); } catch {}
      }
    }
    try { const { logger } = require('./_logger'); if (logger && typeof logger.logTxAudit === 'function') logger.logTxAudit(txHash || 'simulated', sequence || -1, { type: 'AMMWithdraw', poolCurrency, poolIssuer, lpTokenAmount }); } catch {}
    const timestamp = new Date().toISOString();
    return res.status(200).json({ ok: true, executed: execEnabled, txHash, sequence, pool: { currency: poolCurrency, issuer: poolIssuer }, lpTokenAmount, timestamp });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return res.status(500).json({ ok: false, error: message });
  }
};
