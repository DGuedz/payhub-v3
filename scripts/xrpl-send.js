const xrpl = require('xrpl');

async function main() {
  const seed = process.env.XRPL_SEED;
  const destination = process.env.XRPL_DEST;
  const amountXrp = process.env.XRPL_AMOUNT_XRP || '1';
  const ws = process.env.XRPL_WS_URL || (process.env.XRPL_NETWORK === 'mainnet' ? 'wss://xrplcluster.com' : process.env.XRPL_NETWORK === 'devnet' ? 'wss://s.devnet.rippletest.net:51233' : 'wss://s.altnet.rippletest.net:51233');
  if (!seed || !destination) throw new Error('Missing XRPL_SEED or XRPL_DEST');
  const client = new xrpl.Client(ws);
  await client.connect();
  try {
    const wallet = xrpl.Wallet.fromSeed(seed);
    const drops = xrpl.xrpToDrops(String(amountXrp));
    const tx = { TransactionType: 'Payment', Account: wallet.address, Destination: destination, Amount: drops };
    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    const hash = result.result?.hash || result?.tx_json?.hash;
    console.log(JSON.stringify({ ok: true, txHash: hash, sequence: prepared.Sequence }));
  } finally {
    await client.disconnect();
  }
}

main().catch((e) => {
  const msg = e && e.message ? e.message : String(e);
  console.error(JSON.stringify({ ok: false, error: msg }));
  process.exit(1);
});
