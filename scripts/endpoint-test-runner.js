async function main() {
  const base = process.env.API_BASE_URL || 'https://payhub-v3.vercel.app';
  const jwt = process.env.JWT_TOKEN || '';
  async function call(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = 'Bearer ' + jwt;
    const r = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = await r.json();
      return { path, status: r.status, data: j };
    } else {
      const t = await r.text();
      return { path, status: r.status, data: t };
    }
  }
  const results = [];
  results.push(await call('GET', '/api/health'));
  results.push(await call('POST', '/api/trustline-rlusd', { limit: '1000' }));
  const esc = await call('POST', '/api/escrow-create', { value: '1000.00' });
  results.push(esc);
  const offerSequence = esc && esc.data && esc.data.offerSequence ? esc.data.offerSequence : null;
  const owner = esc && esc.data && esc.data.owner ? esc.data.owner : null;
  if (offerSequence && owner) {
    results.push(await call('POST', '/api/escrow-finish', { owner, offerSequence }));
  } else {
    results.push({ path: '/api/escrow-finish', status: 0, data: { skip: true } });
  }
  results.push(await call('POST', '/api/xrp-payment', { destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpVtE', amountXrp: '0.001' }));
  results.push(await call('POST', '/api/cross-currency-payment', {
    destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpVtE',
    deliverCurrency: 'RLUSD',
    deliverIssuer: 'rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv',
    deliverValue: '1.00',
    sourceCurrency: 'XRP',
    sourceIssuer: 'rrrrrrrrrrrrrrrrrrrrrhoLvTp',
    sendMaxValue: '1.00'
  }));
  console.log(JSON.stringify({ ok: true, base, results }));
}
main().catch((e) => { const msg = e && e.message ? e.message : String(e); console.error(JSON.stringify({ ok: false, error: msg })); process.exit(1); });