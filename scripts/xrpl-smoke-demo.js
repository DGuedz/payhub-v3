#!/usr/bin/env node
// PAYHUB (P4YHU3) — XRPL Smoke Demo
// Encadeia Trustline -> EscrowCreate -> EscrowFinish com JWT curto
// Segurança: nunca imprime segredos; exige Authorization Bearer

/* eslint-disable no-console */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function getEnv(name, def) {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : def;
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({ ok: false, error: 'Invalid JSON' }));
  if (!res.ok || body.ok === false) {
    const status = res.status;
    throw new Error(`HTTP ${status}: ${body.error || 'Request failed'}`);
  }
  return body;
}

function getToken() {
  // Prefer TOKEN env; fallback: call scripts/generate-jwt.js to issue a short token
  const tokenEnv = getEnv('TOKEN') || getEnv('JWT_TOKEN') || getEnv('NEXT_PUBLIC_DEV_JWT');
  if (tokenEnv) return tokenEnv;
  const secretPresent = !!getEnv('JWT_SECRET');
  if (!secretPresent) {
    throw new Error('Missing TOKEN env and JWT_SECRET to auto-generate a dev token');
  }
  const out = spawnSync('node', ['scripts/generate-jwt.js'], { encoding: 'utf8' });
  if (out.status !== 0) {
    throw new Error(`Unable to generate dev JWT: ${out.stderr || 'unknown error'}`);
  }
  const token = (out.stdout || '').trim();
  if (!token) throw new Error('Dev JWT generation returned empty token');
  return token;
}

async function main() {
  const baseUrl = getEnv('BASE_URL', 'http://localhost:3000');
  const destination = getEnv('DESTINATION_ADDRESS');
  let owner = getEnv('OWNER_ADDRESS');
  const value = getEnv('AMOUNT_VALUE', '100.00');
  const limit = getEnv('TRUSTLINE_LIMIT', '1000');
  const outputFile = getEnv('OUTPUT_FILE');

  if (!destination) throw new Error('Missing DESTINATION_ADDRESS env');
  // Opcional: derivar OWNER_ADDRESS a partir da XRPL_SEED sem expor segredos
  if (!owner) {
    const seed = getEnv('XRPL_SEED');
    if (seed) {
      try {
        const xrpl = require('xrpl');
        const wallet = xrpl.Wallet.fromSeed(seed);
        owner = wallet.address;
      } catch (e) {
        throw new Error('Unable to derive OWNER_ADDRESS from XRPL_SEED');
      }
    } else {
      throw new Error('Missing OWNER_ADDRESS env');
    }
  }

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const results = {};

  console.log('[P4YHU3-DEMO] Passo 1 — Trustline RLUSD');
  const trust = await fetchJson(`${baseUrl}/api/trustline-rlusd`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ limit }),
  });
  results.trustline = { txHash: trust.txHash, sequence: trust.sequence };
  console.log(JSON.stringify({ step: 'trustline', ...results.trustline }, null, 2));

  await sleep(750);

  console.log('[P4YHU3-DEMO] Passo 2 — EscrowCreate (IOU RLUSD)');
  const esc = await fetchJson(`${baseUrl}/api/escrow-create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ destination, value }),
  });
  results.escrowCreate = { txHash: esc.txHash, offerSequence: esc.offerSequence, destination };
  console.log(JSON.stringify({ step: 'escrow_create', ...results.escrowCreate }, null, 2));

  await sleep(750);

  console.log('[P4YHU3-DEMO] Passo 3 — Antecipar 95% (Payment fora do Escrow)');
  const adv = await fetchJson(`${baseUrl}/api/v1/sdk_p4yhu3/antecipar-escrow`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ merchantWallet: destination, value, owner, offerSequence: esc.offerSequence }),
  });
  results.advancePayment = { txHash: adv.txHash, sequence: adv.sequence, financedAmount: adv.financedAmount };
  console.log(JSON.stringify({ step: 'advance_payment', ...results.advancePayment }, null, 2));

  await sleep(750);

  console.log('[P4YHU3-DEMO] Passo 4 — EscrowFinish (Liquidação)');
  const fin = await fetchJson(`${baseUrl}/api/escrow-finish`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ owner, offerSequence: esc.offerSequence }),
  });
  results.escrowFinish = { txHash: fin.txHash, sequence: fin.sequence, owner };
  console.log(JSON.stringify({ step: 'escrow_finish', ...results.escrowFinish }, null, 2));

  // Persistir evidências, se solicitado
  if (outputFile) {
    const evidence = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      steps: results,
    };
    try {
      fs.writeFileSync(outputFile, JSON.stringify(evidence, null, 2), 'utf8');
      console.log(`[P4YHU3-DEMO] Evidências salvas em ${outputFile}`);
    } catch (e) {
      console.warn('[P4YHU3-DEMO] Falha ao salvar evidências', { error: e.message });
    }
  }

  console.log('[P4YHU3-DEMO] Concluído com sucesso.');
}

main().catch((err) => {
  const msg = err && err.message ? err.message : String(err);
  console.error(JSON.stringify({ level: 'error', msg }));
  process.exit(1);
});