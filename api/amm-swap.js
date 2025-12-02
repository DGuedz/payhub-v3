const { requireAuth } = require('./_auth');
const { getWsUrl } = require('./_xrpl-config');
const { withRetry } = require('./_retry');
const { getDecryptedXRPLSeed } = require('./_kms-adapter');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  try {
    const body = req.body || {};
    const { destination, deliverCurrency, deliverIssuer, deliverValue, sourceCurrency, sourceIssuer, sendMaxValue } = body;
    if (!destination || !deliverCurrency || !deliverIssuer || !deliverValue || !sourceCurrency || !sourceIssuer) return res.status(400).json({ ok: false, error: 'Missing params' });
    let seed;
    try { seed = await getDecryptedXRPLSeed(); } catch (e) { return res.status(500).json({ ok: false, error: e && e.message ? e.message : 'KMS adapter error' }); }
    let xrpl;
    try { xrpl = require('xrpl'); } catch (e) { return res.status(500).json({ ok: false, error: 'Dependency xrpl missing. npm i xrpl' }); }
    const wsUrl = getWsUrl();
    const client = new xrpl.Client(wsUrl);
    await client.connect();
    try {
      const wallet = xrpl.Wallet.fromSeed(seed);
      const destination_amount = { currency: String(deliverCurrency).toUpperCase(), issuer: deliverIssuer, value: String(deliverValue) };
      const send_max = { currency: String(sourceCurrency).toUpperCase(), issuer: sourceIssuer, value: String(sendMaxValue || deliverValue) };
      const pf = await client.request({ command: 'ripple_path_find', source_account: wallet.address, destination_account: destination, destination_amount, send_max });
      const alt = pf.result && pf.result.alternatives ? pf.result.alternatives[0] : null;
      const paths = alt && alt.paths_computed ? alt.paths_computed : [];
      const tx = { TransactionType: 'Payment', Account: wallet.address, Destination: destination, Amount: destination_amount, SendMax: send_max, Paths: paths };
      const prepared = await client.autofill(tx);
      const sequence = prepared.Sequence;
      const signed = wallet.sign(prepared);
      const result = await withRetry(() => client.submitAndWait(signed.tx_blob), { retries: 3, baseMs: 500 });
      const txHash = result.result && result.result.hash ? result.result.hash : (result.tx_json && result.tx_json.hash ? result.tx_json.hash : null);
      try { const { logger } = require('./_logger'); if (logger && typeof logger.logTxAudit === 'function') logger.logTxAudit(txHash || 'unknown', sequence || -1, { type: 'AMM Swap', deliverCurrency, deliverIssuer, sourceCurrency, sourceIssuer }); } catch {}
      return res.status(200).json({ ok: true, txHash, sequence, pathsCount: paths.length });
    } finally {
      await client.disconnect();
    }
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};

