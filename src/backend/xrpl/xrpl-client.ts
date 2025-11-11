/**
 * Cliente XRPL — RLUSD IOU + Escrow (scaffold)
 *
 * Observações de segurança:
 * - Nunca expor XRPL_SEED em frontend, logs ou clientes.
 * - Carregar a seed via variável de ambiente e KMS no backend.
 * - Este módulo é usado pelas rotas de API para assinar no servidor.
 */

// Declarações mínimas para ambientes sem @types/node
declare const process: any;
declare function require(name: string): any;

import logger from '../lib/logger';

// Tipos mínimos
export type AmountIOU = { currency: 'RLUSD'; issuer: string; value: string };

type XRPL = any; // evitar dependência de tipos do módulo 'xrpl'

async function loadXRPL(): Promise<XRPL> {
  try {
    const xrpl = require('xrpl');
    return xrpl;
  } catch (e: any) {
    const msg = 'Dependência xrpl não instalada. Execute: npm i xrpl';
    logger.error(msg);
    throw new Error(msg);
  }
}

export async function connectXRPL(wsUrl?: string) {
  const xrpl = await loadXRPL();
  const url = wsUrl || process.env.XRPL_WS_URL || 'wss://xrplcluster.com';
  const client = new xrpl.Client(url);
  await client.connect();
  logger.info('Conectado à XRPL', { url });
  return { xrpl, client };
}

export async function createTrustlineRLUSD(seed: string, issuer: string, limit = '1000') {
  const { xrpl, client } = await connectXRPL();
  const wallet = xrpl.Wallet.fromSeed(seed);

  const trustSet = {
    TransactionType: 'TrustSet',
    Account: wallet.address,
    LimitAmount: { currency: 'RLUSD', issuer, value: limit },
  } as any;

  try {
    const prepared = await client.autofill(trustSet);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    const txHash = result.result?.hash || result?.tx_json?.hash;
    const sequence = prepared.Sequence;
    logger.logTxAudit(txHash || 'unknown', sequence || -1, { type: 'TrustSet' });
    return { txHash, sequence, result };
  } finally {
    await client.disconnect();
  }
}

export async function escrowCreateIOU(
  seed: string,
  destination: string,
  amount: AmountIOU,
  finishAfterUnix?: number
) {
  const { xrpl, client } = await connectXRPL();
  const wallet = xrpl.Wallet.fromSeed(seed);

  const escrowCreate = {
    TransactionType: 'EscrowCreate',
    Account: wallet.address,
    Destination: destination,
    Amount: amount as any, // IOU (RLUSD)
    // Opcional: FinishAfter (UNIX time)
    ...(finishAfterUnix ? { FinishAfter: finishAfterUnix } : {}),
  } as any;

  try {
    const prepared = await client.autofill(escrowCreate);
    const usedSequence = prepared.Sequence;
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    const txHash = result.result?.hash || result?.tx_json?.hash;
    logger.logTxAudit(txHash || 'unknown', usedSequence || -1, { type: 'EscrowCreate' });
    return { txHash, offerSequence: usedSequence, result };
  } finally {
    await client.disconnect();
  }
}

export async function finishEscrow(seed: string, owner: string, offerSequence: number) {
  const { xrpl, client } = await connectXRPL();
  const wallet = xrpl.Wallet.fromSeed(seed);

  const escrowFinish = {
    TransactionType: 'EscrowFinish',
    Account: wallet.address,
    Owner: owner,
    OfferSequence: offerSequence,
  } as any;

  try {
    const prepared = await client.autofill(escrowFinish);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    const txHash = result.result?.hash || result?.tx_json?.hash;
    const sequence = prepared.Sequence;
    logger.logTxAudit(txHash || 'unknown', sequence || -1, { type: 'EscrowFinish' });
    return { txHash, sequence, result };
  } finally {
    await client.disconnect();
  }
}