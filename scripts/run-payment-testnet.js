// Executa uma transação de pagamento XRP na testnet com carteiras efêmeras
// Segurança: não imprime seeds; usa faucet para financiar a carteira remetente

async function main() {
  const xrpl = require('xrpl');

  const sender = xrpl.Wallet.generate();
  const recipient = xrpl.Wallet.generate();

  async function fund(address) {
    const res = await fetch('https://faucet.altnet.rippletest.net/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: address })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Faucet HTTP ${res.status}: ${txt}`);
    }
    const j = await res.json();
    return j && j.account && (j.account.classicAddress || j.account.address) ? j.account : null;
  }

  const funded = await fund(sender.address);
  if (!funded) throw new Error('Faucet funding failed');

  const ws = 'wss://s.altnet.rippletest.net:51233';
  const client = new xrpl.Client(ws);
  await client.connect();
  try {
    const drops = xrpl.xrpToDrops('1');
    const baseTx = {
      TransactionType: 'Payment',
      Account: sender.address,
      Destination: recipient.address,
      Amount: drops,
    };
    let attempts = 0;
    let lastErr = null;
    while (attempts < 3) {
      attempts++;
      try {
        const prepared = await client.autofill(baseTx);
        const signed = sender.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);
        const hash = (result.result && result.result.hash) || (result.tx_json && result.tx_json.hash) || null;
        console.log(JSON.stringify({ ok: true, network: 'testnet', txHash: hash, sequence: prepared.Sequence, from: sender.address, to: recipient.address }));
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        await new Promise(r => setTimeout(r, 600));
      }
    }
    if (lastErr) throw lastErr;
  } finally {
    await client.disconnect();
  }
}

main().catch((e) => {
  const msg = e && e.message ? e.message : String(e);
  console.error(JSON.stringify({ ok: false, error: msg }));
  process.exit(1);
});