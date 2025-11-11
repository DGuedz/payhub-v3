// XRPL Client (TypeScript) — PAYHUB P4YHU3
// Responsável por operações críticas assinadas no backend.
// Compliance: XRPL_SEED somente via env (KMS/variável de ambiente), sem logs de segredos.

import type { Client } from 'xrpl';
// KMS adapter para obter XRPL_SEED com segurança (conceitual)
import { kmsAdapter } from '../security/kms-adapter';

type XRPLModule = typeof import('xrpl');

interface EscrowFinishResult {
  ok: boolean;
  txHash?: string;
  sequence?: number;
  error?: string;
}

function getWsUrl(): string {
  // Reuso da configuração JS existente sem expor segredos
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cfg = require('../../../api/_xrpl-config');
  return cfg.getWsUrl();
}

function getLogger() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../../../api/_logger');
  return mod.logger;
}

export async function finishEscrow(owner: string, offerSequence: number): Promise<EscrowFinishResult> {
  // Recupera seed de forma segura via adapter (env/KMS/Vault)
  let seed: string;
  try {
    seed = await kmsAdapter.getDecryptedXRPLSeed();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'KMS adapter error' };
  }
  if (!owner || typeof offerSequence !== 'number') {
    return { ok: false, error: 'Missing owner or offerSequence' };
  }

  let xrpl: XRPLModule;
  try {
    xrpl = require('xrpl');
  } catch (e: any) {
    return { ok: false, error: 'Dependency xrpl missing. npm i xrpl' };
  }

  const wsUrl = getWsUrl();
  const client: Client = new xrpl.Client(wsUrl);
  await client.connect();
  try {
    const wallet = xrpl.Wallet.fromSeed(seed);
    const tx = {
      TransactionType: 'EscrowFinish',
      Account: wallet.address,
      Owner: owner,
      OfferSequence: offerSequence,
    } as any;

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    const txHash = (result as any).result?.hash || (result as any)?.tx_json?.hash;
    const sequence = (prepared as any).Sequence;

    try {
      const logger = getLogger();
      if (logger && typeof logger.logTxAudit === 'function') {
        logger.logTxAudit(txHash || 'unknown', sequence ?? -1, {
          type: 'EscrowFinish',
          owner,
          account: wallet.address,
        });
      }
    } catch {}

    return { ok: true, txHash, sequence };
  } catch (err: any) {
    const message = err?.message || String(err);
    return { ok: false, error: message };
  } finally {
    await client.disconnect();
  }
}