declare const process: any;
declare function require(name: string): any;

import logger from '../lib/logger';

export interface TrustlineParams { limit: string }
export interface TrustlineResult { ok: boolean; txHash?: string; sequence?: number }

export async function trustlineRlusd(params: TrustlineParams): Promise<TrustlineResult> {
  const seed: string = process.env.XRPL_SEED;
  const issuer: string = process.env.RLUSD_ISSUER_ADDRESS;
  const wsUrl: string = require('../../api/_xrpl-config').getWsUrl();
  const { withRetry } = require('../../api/_retry');
  if (!seed || !issuer || !params.limit) return { ok: false };
  let xrpl: any = require('xrpl');
  const client = new xrpl.Client(wsUrl);
  await client.connect();
  try {
    const wallet = xrpl.Wallet.fromSeed(seed);
    const tx: any = { TransactionType: 'TrustSet', Account: wallet.address, LimitAmount: { currency: 'RLUSD', issuer, value: params.limit } };
    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await withRetry(() => client.submitAndWait(signed.tx_blob), { retries: 3, baseMs: 500 });
    const txHash = result.result?.hash || result?.tx_json?.hash;
    const sequence = prepared.Sequence;
    try { logger.audit('XRPL Transaction', { txHash, sequence, type: 'TrustSet', account: wallet.address, issuer }); } catch {}
    return { ok: true, txHash, sequence };
  } finally { await client.disconnect(); }
}
