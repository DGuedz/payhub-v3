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

    const {
      destination,
      deliverCurrency,
      deliverIssuer,
      deliverValue,
      sourceCurrency,
      sourceIssuer,
      sendMaxValue,
    } = req.body || {};

    if (!destination || !deliverCurrency || !deliverIssuer || !deliverValue || !sourceCurrency || !sourceIssuer) {
      return res.status(400).json({ ok: false, error: 'Missing destination/deliver/source params' });
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

    const screening = await screenPayment({ type: 'CrossCurrency', currency: deliverCurrency, value: Number(deliverValue), owner: destination });
    if (!screening.allowed) {
      return res.status(403).json({ ok: false, error: screening.reason || 'SCREENING_FAILED' });
    }

    const client = new xrpl.Client(wsUrl);
    await client.connect();
    try {
      const wallet = xrpl.Wallet.fromSeed(seed);
      const destinationAmount = { currency: String(deliverCurrency).toUpperCase(), issuer: deliverIssuer, value: String(deliverValue) };
      const pathFindReq = {
        command: 'ripple_path_find',
        source_account: wallet.address,
        destination_account: destination,
        destination_amount: destinationAmount,
        send_max: { currency: String(sourceCurrency).toUpperCase(), issuer: sourceIssuer, value: String(sendMaxValue || deliverValue) },
      };
      const pf = await client.request(pathFindReq);
      const alt = pf.result?.alternatives && pf.result.alternatives[0];
      const paths = alt?.paths_computed || [];

      const tx = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: destination,
        Amount: destinationAmount,
        SendMax: { currency: String(sourceCurrency).toUpperCase(), issuer: sourceIssuer, value: String(sendMaxValue || deliverValue) },
        Paths: paths,
      };

      const prepared = await client.autofill(tx);
      const sequence = prepared.Sequence;
      const signed = wallet.sign(prepared);
      const result = await withRetry(() => client.submitAndWait(signed.tx_blob), { retries: 3, baseMs: 500 });
      const txHash = result.result?.hash || result?.tx_json?.hash;
      try {
        const { logger } = require('./_logger');
        if (logger && typeof logger.logTxAudit === 'function') {
          logger.logTxAudit(txHash || 'unknown', sequence || -1, { type: 'Payment', mode: 'CROSS_CURRENCY', deliverCurrency, sourceCurrency });
        }
      } catch {}
      return res.status(200).json({ ok: true, txHash, sequence, usedPaths: paths.length });
    } finally {
      await client.disconnect();
    }
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};
