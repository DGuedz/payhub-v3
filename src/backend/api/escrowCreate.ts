declare const process: any;
declare function require(name: string): any;

import logger from '../lib/logger';
import { AmountIOU } from '../xrpl/xrpl-client';

export interface EscrowCreateParams {
  value: string;
  finishAfterUnix?: number;
  policy?: Record<string, any>;
  preimageHex?: string;
  memoText?: string;
}

export interface EscrowCreateResult {
  ok: boolean;
  txHash?: string;
  offerSequence?: number;
  owner?: string;
  condition?: string | null;
}

export async function escrowCreate(params: EscrowCreateParams): Promise<EscrowCreateResult> {
  const issuer: string = process.env.RLUSD_ISSUER_ADDRESS;
  const seed: string = process.env.XRPL_SEED;
  const treasuryVault: string = process.env.TREASURY_VAULT_ADDRESS;
  const wsUrl: string = require('../../api/_xrpl-config').getWsUrl();
  const { withRetry } = require('../../api/_retry');
  const { screenPayment } = require('../../api/_screening');

  if (!issuer || !seed || !treasuryVault) {
    return { ok: false };
  }
  if (!params.value) {
    return { ok: false };
  }

  const screening = await screenPayment({ type: 'EscrowCreate', currency: 'RLUSD', value: params.value, issuer });
  if (!screening.allowed) return { ok: false };

  let xrpl: any;
  xrpl = require('xrpl');
  const client = new xrpl.Client(wsUrl);
  await client.connect();
  try {
    const wallet = xrpl.Wallet.fromSeed(seed);
    const amountDrops = (() => {
      try { return xrpl.xrpToDrops(String(params.value)); } catch { return xrpl.xrpToDrops('0.001'); }
    })();
    const memos: Array<{ Memo: { MemoType: string; MemoData: string } }> = [];
    if (params.policy) {
      memos.push({ Memo: { MemoType: Buffer.from('SMART_ESCROW_POLICY').toString('hex').toUpperCase(), MemoData: Buffer.from(JSON.stringify(params.policy)).toString('hex').toUpperCase() } });
    }
    if (params.memoText && typeof params.memoText === 'string' && params.memoText.trim().length > 0) {
      memos.push({ Memo: { MemoType: Buffer.from('INSCRIPTION').toString('hex').toUpperCase(), MemoData: Buffer.from(params.memoText.trim()).toString('hex').toUpperCase() } });
    }
    let condition: string | undefined;
    if (params.preimageHex && /^[0-9A-Fa-f]+$/.test(params.preimageHex)) {
      const preimageBuf = Buffer.from(params.preimageHex, 'hex');
      const hash = xrpl.sha256(preimageBuf);
      condition = hash.toUpperCase();
    }
    const tx: any = {
      TransactionType: 'EscrowCreate',
      Account: wallet.address,
      Destination: treasuryVault,
      Amount: amountDrops,
      ...(params.finishAfterUnix ? { FinishAfter: params.finishAfterUnix } : {}),
      ...(condition ? { Condition: condition } : {}),
      ...(memos.length ? { Memos: memos } : {}),
    };
    const prepared = await client.autofill(tx);
    const offerSequence = prepared.Sequence;
    const signed = wallet.sign(prepared);
    const result = await withRetry(() => client.submitAndWait(signed.tx_blob), { retries: 3, baseMs: 500 });
    const txHash = result.result?.hash || result?.tx_json?.hash;
    try { logger.audit('XRPL Transaction', { txHash, sequence: offerSequence, type: 'EscrowCreate', owner: wallet.address }); } catch {}
    return { ok: true, txHash, offerSequence, owner: wallet.address, condition: condition || null };
  } finally {
    await client.disconnect();
  }
}
