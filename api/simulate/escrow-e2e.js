const { requireAuth } = require('../_auth');

function r(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function s(n) { const S = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; return Array.from({ length: n }, () => S[Math.floor(Math.random() * S.length)]).join(''); }
function addr() { const a = 'r123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; let x = 'r'; const n = r(25, 30); for (let i = 0; i < n; i++) x += a[Math.floor(Math.random() * a.length)]; return x; }

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res); if (!authUser) return;
  try {
    const body = req.body || {};
    const value = String(body.value || '100.00');
    const issuer = process.env.RLUSD_ISSUER_ADDRESS || addr();
    const merchantWallet = String(body.merchantWallet || addr());
    const treasuryVault = process.env.TREASURY_VAULT_ADDRESS || addr();
    const owner = addr();
    const offerSequence = r(100000, 999999);

    const tl = { txHash: `TL-${Date.now()}-${s(6)}`, sequence: r(1000, 9999), status: 'TRUSTLINE_OK' };
    const create = { txHash: `ESC-${Date.now()}-${s(8)}`, offerSequence, owner, destination: treasuryVault, amount: { currency: 'RLUSD', issuer, value } };
    const financed = (Number(value) * 0.95).toFixed(2);
    const advance = { txHash: `ADV-${Date.now()}-${s(8)}`, sequence: r(1000, 9999), financedAmount: financed, destination: merchantWallet };
    const finish = { txHash: `FIN-${Date.now()}-${s(8)}`, sequence: r(1000, 9999), owner, offerSequence };
    const pathsCount = r(1, 3);

    const artifacts = { trustline: tl, escrowCreate: create, advance95: advance, escrowFinish: finish, pathsCount };
    const csv = [
      'operation,tx_hash,sequence,owner,offer_sequence,destination,amount_currency,amount_value,amount_issuer,status,timestamp',
      `TRUSTLINE,${tl.txHash},${tl.sequence},,,${issuer},${value},${issuer},${tl.status},${new Date().toISOString()}`,
      `ESCROW_CREATE,${create.txHash},${offerSequence},${owner},${offerSequence},${treasuryVault},RLUSD,${value},${issuer},CREATED,${new Date().toISOString()}`,
      `ADVANCE_95,${advance.txHash},${advance.sequence},,,${merchantWallet},RLUSD,${financed},${issuer},PAID,${new Date().toISOString()}`,
      `ESCROW_FINISH,${finish.txHash},${finish.sequence},${owner},${offerSequence},,,RLUSD,0,FINISHED,${new Date().toISOString()}`
    ].join('\n');

    return res.status(200).json({ ok: true, artifacts, report: { format: 'csv', content: csv } });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return res.status(500).json({ ok: false, error: message });
  }
};