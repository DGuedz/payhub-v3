declare const process: any;
declare function require(name: string): any;

import logger from '../lib/logger';

export interface EscrowFinishParams {
  owner: string;
  offerSequence: number;
  fulfillmentHex?: string;
  policy?: Record<string, any>;
}

export interface EscrowFinishResult {
  ok: boolean;
  txHash?: string;
  sequence?: number;
}

export async function escrowFinish(params: EscrowFinishParams): Promise<EscrowFinishResult> {
  const wsUrl: string = require('../../api/_xrpl-config').getWsUrl();
  const { withRetry } = require('../../api/_retry');
  const { getDecryptedXRPLSeed } = require('../../api/_kms-adapter');
  const { screenPayment } = require('../../api/_screening');
  let xrpl: any = require('xrpl');
  const { enforcePolicy } = require('../smart-escrow-policy');

  if (!params.owner || typeof params.offerSequence !== 'number') return { ok: false };
  const seed: string = await getDecryptedXRPLSeed();
  const screening = await screenPayment({ type: 'EscrowFinish', owner: params.owner, offerSequence: params.offerSequence });
  if (!screening.allowed) return { ok: false };

  const client = new xrpl.Client(wsUrl);
  await client.connect();
  try {
    const wallet = xrpl.Wallet.fromSeed(seed);
    const okPolicy = await enforcePolicy(params.policy, { xrpl, client, screenPayment });
    if (!okPolicy) return { ok: false };
    const tx: any = {
      TransactionType: 'EscrowFinish',
      Account: wallet.address,
      Owner: params.owner,
      OfferSequence: params.offerSequence,
      ...(params.fulfillmentHex && /^[0-9A-Fa-f]+$/.test(params.fulfillmentHex) ? { Fulfillment: params.fulfillmentHex.toUpperCase() } : {}),
    };
    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await withRetry(() => client.submitAndWait(signed.tx_blob), { retries: 3, baseMs: 500 });
    const txHash = result.result?.hash || result?.tx_json?.hash;
    const sequence = prepared.Sequence;
    try { logger.audit('XRPL Transaction', { txHash, sequence, type: 'EscrowFinish', owner: params.owner, account: wallet.address }); } catch {}
    return { ok: true, txHash, sequence };
  } finally {
    await client.disconnect();
  }
}
