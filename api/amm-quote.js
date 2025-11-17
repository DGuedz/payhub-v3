const { getWsUrl } = require('./_xrpl-config');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  try {
    const body = req.body || {};
    const { sourceAccount, destinationAccount, deliverCurrency, deliverIssuer, deliverValue, sendMaxCurrency, sendMaxIssuer, sendMaxValue } = body;
    if (!sourceAccount || !destinationAccount || !deliverCurrency || !deliverIssuer || !deliverValue) return res.status(400).json({ ok: false, error: 'Missing params' });
    let xrpl;
    try { xrpl = require('xrpl'); } catch (e) { return res.status(500).json({ ok: false, error: 'Dependency xrpl missing. npm i xrpl' }); }
    const wsUrl = getWsUrl();
    const client = new xrpl.Client(wsUrl);
    await client.connect();
    try {
      const destination_amount = { currency: String(deliverCurrency).toUpperCase(), issuer: deliverIssuer, value: String(deliverValue) };
      const send_max = sendMaxCurrency ? { currency: String(sendMaxCurrency).toUpperCase(), issuer: sendMaxIssuer, value: String(sendMaxValue || deliverValue) } : undefined;
      const pf = await client.request({ command: 'ripple_path_find', source_account: sourceAccount, destination_account: destinationAccount, destination_amount, ...(send_max ? { send_max } : {}) });
      const alt = pf.result && pf.result.alternatives ? pf.result.alternatives[0] : null;
      const paths = alt && alt.paths_computed ? alt.paths_computed : [];
      return res.status(200).json({ ok: true, alternatives: pf.result.alternatives || [], pathsCount: paths.length });
    } finally {
      await client.disconnect();
    }
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};

