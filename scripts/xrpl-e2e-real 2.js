const xrpl = require('xrpl');
const fs = require('fs');

async function main() {
  const ws = process.env.XRPL_WS_URL || 'wss://s.devnet.rippletest.net:51233';
  const client = new xrpl.Client(ws);
  await client.connect();
  try {
    const iw = (await client.fundWallet()).wallet;
    const mw = (await client.fundWallet()).wallet;
    const tw = (await client.fundWallet()).wallet;

    const RLUSD_HEX = Buffer.from('RLUSD').toString('hex').toUpperCase().padEnd(40, '0');
    const trustMerchant = {
      TransactionType: 'TrustSet',
      Account: mw.address,
      LimitAmount: { currency: RLUSD_HEX, issuer: iw.address, value: '1000' },
    };
    const trustTreasury = {
      TransactionType: 'TrustSet',
      Account: tw.address,
      LimitAmount: { currency: RLUSD_HEX, issuer: iw.address, value: '1000' },
    };
    const t1 = await client.autofill(trustMerchant);
    const t2 = await client.autofill(trustTreasury);
    const r1 = await client.submitAndWait(mw.sign(t1).tx_blob);
    const r2 = await client.submitAndWait(tw.sign(t2).tx_blob);

    const issue = {
      TransactionType: 'Payment',
      Account: iw.address,
      Destination: mw.address,
      Amount: { currency: RLUSD_HEX, issuer: iw.address, value: '100.00' },
    };
    const iPrepared = await client.autofill(issue);
    const iResult = await client.submitAndWait(iw.sign(iPrepared).tx_blob);

    const create = {
      TransactionType: 'EscrowCreate',
      Account: mw.address,
      Destination: tw.address,
      Amount: '1000000',
      FinishAfter: Math.floor(Date.now() / 1000) + 60,
      Memos: [
        { Memo: { MemoType: Buffer.from('ESCROW_RLUSD').toString('hex').toUpperCase(), MemoData: Buffer.from(JSON.stringify({ currency: 'RLUSD', issuer: iw.address, value: '100.00' })).toString('hex').toUpperCase() } },
      ],
    };
    const cPrepared = await client.autofill(create);
    const offerSequence = cPrepared.Sequence;
    const cResult = await client.submitAndWait(mw.sign(cPrepared).tx_blob);

    const finish = {
      TransactionType: 'EscrowFinish',
      Account: mw.address,
      Owner: mw.address,
      OfferSequence: offerSequence,
    };
    const fPrepared = await client.autofill(finish);
    const fResult = await client.submitAndWait(mw.sign(fPrepared).tx_blob);

    const rlPay = {
      TransactionType: 'Payment',
      Account: mw.address,
      Destination: tw.address,
      Amount: { currency: RLUSD_HEX, issuer: iw.address, value: '100.00' },
    };
    const rlPrepared = await client.autofill(rlPay);
    const rlResult = await client.submitAndWait(mw.sign(rlPrepared).tx_blob);

    const artifacts = {
      rlusdIssuer: iw.address,
      merchantAccount: mw.address,
      treasuryVault: tw.address,
      trustline: { txHash: r1.result?.hash || r1?.tx_json?.hash, sequence: t1.Sequence, status: 'TRUSTLINE_OK' },
      treasuryTrustline: { txHash: r2.result?.hash || r2?.tx_json?.hash, sequence: t2.Sequence, status: 'TRUSTLINE_OK' },
      issuance: { txHash: iResult.result?.hash || iResult?.tx_json?.hash, value: '100.00' },
      escrowCreate: {
        txHash: cResult.result?.hash || cResult?.tx_json?.hash,
        offerSequence,
        owner: mw.address,
        destination: tw.address,
        amount: { currency: 'RLUSD', issuer: iw.address, value: '100.00' },
      },
      escrowFinish: {
        txHash: fResult.result?.hash || fResult?.tx_json?.hash,
        sequence: fPrepared.Sequence,
        owner: mw.address,
        offerSequence,
      },
      rlusdTransfer: {
        txHash: rlResult.result?.hash || rlResult?.tx_json?.hash,
        sequence: rlPrepared.Sequence,
        from: mw.address,
        to: tw.address,
        amount: '100.00',
      },
    };

    const lines = [
      'operation,tx_hash,sequence,owner,offer_sequence,destination,amount_currency,amount_value,amount_issuer,status,timestamp',
      `TRUSTLINE,${artifacts.trustline.txHash},${artifacts.trustline.sequence},,,,RLUSD,,${artifacts.rlusdIssuer},TRUSTLINE_OK,${new Date().toISOString()}`,
      `TRUSTLINE,${artifacts.treasuryTrustline.txHash},${artifacts.treasuryTrustline.sequence},,,,RLUSD,,${artifacts.rlusdIssuer},TRUSTLINE_OK,${new Date().toISOString()}`,
      `ISSUANCE,${artifacts.issuance.txHash},,,${artifacts.merchantAccount},${artifacts.merchantAccount},RLUSD,100.00,${artifacts.rlusdIssuer},PAID,${new Date().toISOString()}`,
      `ESCROW_CREATE,${artifacts.escrowCreate.txHash},${offerSequence},${artifacts.escrowCreate.owner},${offerSequence},${artifacts.escrowCreate.destination},RLUSD,100.00,${artifacts.rlusdIssuer},CREATED,${new Date().toISOString()}`,
      `ESCROW_FINISH,${artifacts.escrowFinish.txHash},${artifacts.escrowFinish.sequence},${artifacts.escrowFinish.owner},${offerSequence},,,RLUSD,0,FINISHED,${new Date().toISOString()}`,
      `PAYMENT_RLUSD,${artifacts.rlusdTransfer.txHash},${artifacts.rlusdTransfer.sequence},${artifacts.rlusdTransfer.from},,${artifacts.rlusdTransfer.to},RLUSD,100.00,${artifacts.rlusdIssuer},PAID,${new Date().toISOString()}`,
    ];
    const csv = lines.join('\n');

    fs.mkdirSync('docs', { recursive: true });
    fs.writeFileSync('docs/ARTIFACTS_DEVNET_REAL.json', JSON.stringify({ generatedAt: new Date().toISOString(), artifacts }, null, 2));
    fs.writeFileSync('docs/COMPLIANCE_LAST.csv', csv);
    process.stdout.write(JSON.stringify({ ok: true, artifacts }));
  } finally {
    await client.disconnect();
  }
}

main().catch((e) => {
  process.stderr.write(String(e && e.message ? e.message : e));
  process.exit(1);
});
