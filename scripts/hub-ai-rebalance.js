async function main() {
  const base = process.env.API_BASE_URL || 'http://localhost:3000';
  const jwt = process.env.JWT_TOKEN || '';
  const headers = { 'Content-Type': 'application/json', ...(jwt ? { Authorization: 'Bearer ' + jwt } : {}) };
  const payload = {
    sourceAccount: process.env.SOURCE_ACCOUNT || 'rSOURCE',
    destinationAccount: process.env.DEST_ACCOUNT || 'rDEST',
    deliverCurrency: process.env.DELIVER_CURRENCY || 'RLUSD',
    deliverIssuer: process.env.DELIVER_ISSUER || 'rISSUER',
    deliverValue: process.env.DELIVER_VALUE || '10',
    sendMaxCurrency: process.env.SOURCE_CURRENCY || 'XRP',
    sendMaxIssuer: process.env.SOURCE_ISSUER || 'rrrrrrrrrrrrrrrrrrrrrhoLvTp',
    sendMaxValue: process.env.SEND_MAX_VALUE || '10',
  };
  const r = await fetch(base + '/api/amm/quote', { method: 'POST', headers, body: JSON.stringify(payload) });
  const j = await r.json();
  const decision = j.pathsCount && j.pathsCount > 0 ? 'SWAP' : 'WAIT';
  console.log(JSON.stringify({ ok: true, decision, quote: j }));
}
main().catch((e) => { const msg = e && e.message ? e.message : String(e); console.error(JSON.stringify({ ok: false, error: msg })); process.exit(1); });

