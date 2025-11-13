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
    if (!authUser) return;

    const { destination, amountXrp, amountDrops } = req.body || {};
    if (!destination) {
      return res.status(400).json({ ok: false, error: 'Missing destination' });
    }

    let seed;
    try { seed = await getDecryptedXRPLSeed(); } catch (e) {
      return res.status(500).json({ ok: false, error: e && e.message ? e.message : 'KMS adapter error' });
    }
    const wsUrl = getWsUrl();

    let xrpl;
    try { xrpl = require('xrpl'); } catch (e) {
      return res.status(500).json({ ok: false, error: 'Dependency xrpl missing. npm i xrpl' });
    }

    const drops = amountDrops ? String(amountDrops) : (amountXrp ? xrpl.xrpToDrops(String(amountXrp)) : null);
    if (!drops) {
      return res.status(400).json({ ok: false, error: 'Missing amountXrp or amountDrops' });
    }

    const screening = await screenPayment({ type: 'DirectXrpPayment', currency: 'XRP', value: Number(xrpl.dropsToXrp(drops)) });
    if (!screening.allowed) {
      return res.status(403).json({ ok: false, error: screening.reason || 'SCREENING_FAILED' });
    }

    const client = new xrpl.Client(wsUrl);
    await client.connect();
    try {
      const wallet = xrpl.Wallet.fromSeed(seed);
      const tx = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: destination,
        Amount: drops,
      };
      const prepared = await client.autofill(tx);
      const sequence = prepared.Sequence;
      const signed = wallet.sign(prepared);
      const result = await withRetry(() => client.submitAndWait(signed.tx_blob), { retries: 3, baseMs: 500 });
      const txHash = result.result?.hash || result?.tx_json?.hash;
      try {
        const { logger } = require('./_logger');
        if (logger && typeof logger.logTxAudit === 'function') {
          logger.logTxAudit(txHash || 'unknown', sequence || -1, { type: 'Payment', currency: 'XRP', destination });
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
