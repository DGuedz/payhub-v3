// Simula tokenização de recebível de R$1000 como IOU RLUSD e EscrowCreate
// Carteiras efêmeras; sem exposição de seeds; funding via faucet testnet

async function main() {
  const xrpl = require('xrpl');

  const CURRENCY_HEX = '524C555344000000000000000000000000000000'; // RLUSD (ASCII) padded

  const issuer = xrpl.Wallet.generate();
  const merchant = xrpl.Wallet.generate();
  const vault = xrpl.Wallet.generate();

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
    return res.json();
  }

  await Promise.all([fund(issuer.address), fund(merchant.address), fund(vault.address)]);

  const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
  await client.connect();
  try {
    // Emissor: habilita Allow Trust Line Locking para permitir escrow de tokens
    const allowLockingTx = {
      TransactionType: 'AccountSet',
      Account: issuer.address,
      SetFlag: 17, // asfAllowTrustLineLocking
    };
    const allowPrepared = await client.autofill(allowLockingTx);
    const allowSigned = issuer.sign(allowPrepared);
    await client.submitAndWait(allowSigned.tx_blob);

    // Trustline do MERCHANT para o emissor RLUSD (limite >= 1000)
    const trustTx = {
      TransactionType: 'TrustSet',
      Account: merchant.address,
      LimitAmount: { currency: CURRENCY_HEX, issuer: issuer.address, value: '2000' },
    };
    const trustPrepared = await client.autofill(trustTx);
    const trustSigned = merchant.sign(trustPrepared);
    const trustRes = await client.submitAndWait(trustSigned.tx_blob);
    const trustTxHash = trustRes.result?.hash || trustRes?.tx_json?.hash || null;

    // Emissão de IOU: emissor credita 1000 RLUSD ao MERCHANT
    const issuePayment = {
      TransactionType: 'Payment',
      Account: issuer.address,
      Destination: merchant.address,
      Amount: { currency: CURRENCY_HEX, issuer: issuer.address, value: '1000.00' },
    };
    const issuePrepared = await client.autofill(issuePayment);
    const issueSigned = issuer.sign(issuePrepared);
    const issueRes = await client.submitAndWait(issueSigned.tx_blob);
    const issuanceTxHash = issueRes.result?.hash || issueRes?.tx_json?.hash || null;

    // EscrowCreate do MERCHANT para o VAULT com 1000 RLUSD
    const nowUnix = Math.floor(Date.now() / 1000);
    const rippleEpochOffset = 946684800; // 1970->2000 offset
    const cancelAfter = (nowUnix - rippleEpochOffset) + 3600; // expira em ~1h
    const finishAfter = (nowUnix - rippleEpochOffset) + 600; // liberável após ~10min
    let escrowTxHash = null;
    let offerSequence = null;
    for (let i = 0; i < 5; i++) {
      try {
        const escrowTx = {
          TransactionType: 'EscrowCreate',
          Account: merchant.address,
          Destination: vault.address,
          Amount: { currency: CURRENCY_HEX, issuer: issuer.address, value: '1000.00' },
          CancelAfter: cancelAfter,
          FinishAfter: finishAfter,
        };
        const escPrepared = await client.autofill(escrowTx);
        offerSequence = escPrepared.Sequence;
        const escSigned = merchant.sign(escPrepared);
        const escRes = await client.submitAndWait(escSigned.tx_blob);
        escrowTxHash = escRes.result?.hash || escRes?.tx_json?.hash || null;
        if (escrowTxHash) break;
      } catch (e) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    console.log(JSON.stringify({
      ok: true,
      trustTxHash: trustTxHash,
      issuanceTxHash: issuanceTxHash,
      escrowTxHash: escrowTxHash,
      owner: merchant.address,
      offerSequence: offerSequence,
      issuer: issuer.address,
      vault: vault.address,
    }));
  } finally {
    await client.disconnect();
  }
}

main().catch((e) => {
  const msg = e && e.message ? e.message : String(e);
  console.error(JSON.stringify({ ok: false, error: msg }));
  process.exit(1);
});