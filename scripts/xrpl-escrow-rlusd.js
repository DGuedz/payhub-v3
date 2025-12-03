const xrpl = require('xrpl');

function getCurrencyCode() {
  const hex = process.env.RLUSD_CURRENCY_HEX;
  const code = process.env.RLUSD_CODE || 'RLUSD';
  if (hex && /^[0-9A-Fa-f]{40}$/.test(hex)) return hex.toUpperCase();
  return code;
}

async function main() {
  const seed = process.env.XRPL_SEED;
  const issuer = process.env.RLUSD_ISSUER_ADDRESS;
  const destination = process.env.TREASURY_VAULT_ADDRESS || process.env.RLUSD_DESTINATION;
  const limit = process.env.RLUSD_TRUST_LIMIT || '1000';
  const value = process.env.RLUSD_ESCROW_VALUE || '100.00';
  const ws = process.env.XRPL_WS_URL || (process.env.XRPL_NETWORK === 'mainnet' ? 'wss://xrplcluster.com' : process.env.XRPL_NETWORK === 'devnet' ? 'wss://s.devnet.rippletest.net:51233' : 'wss://s.altnet.rippletest.net:51233');
  if (!seed || !issuer || !destination) throw new Error('Missing XRPL_SEED or RLUSD_ISSUER_ADDRESS or destination');
  const client = new xrpl.Client(ws);
  await client.connect();
  try {
    const wallet = xrpl.Wallet.fromSeed(seed);
    const currency = getCurrencyCode();
    const trust = { TransactionType: 'TrustSet', Account: wallet.address, LimitAmount: { currency, issuer, value: String(limit) } };
    const trustPrepared = await client.autofill(trust);
    const trustSigned = wallet.sign(trustPrepared);
    const trustRes = await client.submitAndWait(trustSigned.tx_blob);
    const trustHash = trustRes.result?.hash || trustRes?.tx_json?.hash;
    const escrow = { TransactionType: 'EscrowCreate', Account: wallet.address, Destination: destination, Amount: { currency, issuer, value: String(value) } };
    const escPrepared = await client.autofill(escrow);
    const offerSeq = escPrepared.Sequence;
    const escSigned = wallet.sign(escPrepared);
    const escRes = await client.submitAndWait(escSigned.tx_blob);
    const escHash = escRes.result?.hash || escRes?.tx_json?.hash;
    console.log(JSON.stringify({ ok: true, trustTxHash: trustHash, escrowTxHash: escHash, offerSequence: offerSeq }));
  } finally {
    await client.disconnect();
  }
}

main().catch((e) => {
  const msg = e && e.message ? e.message : String(e);
  console.error(JSON.stringify({ ok: false, error: msg }));
  process.exit(1);
});
