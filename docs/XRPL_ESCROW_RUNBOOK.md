# Runbook — RLUSD Trustline, Escrow (Colateral) & Antecipação (PAYHUB_V3 V2)

## Pré-requisitos
- `XRPL_SEED` e `XRPL_SEED_FUNDING` em `.env.local` (não versionado), preferencialmente via KMS.
- `RLUSD_ISSUER_ADDRESS` configurado.
- `TREASURY_VAULT_ADDRESS` (destino do Escrow V2).
- `JWT_SECRET` para autenticação das rotas críticas.
- `XRPL_NETWORK` (ex.: `devnet`, `testnet`, `mainnet`) e opcional `XRPL_WS_URL` para override.

## Fluxo
1. Criar trustline RLUSD (backend)
   - Endpoint: `POST /api/trustline-rlusd`
   - TransactionType: `TrustSet`
   - `LimitAmount: { currency: 'RLUSD', issuer, value }`

2. EscrowCreate (IOU RLUSD — destino vault financiador)
   - `POST /api/escrow/create`
   - Body: `{ value, finishAfterUnix? }`
   - Resposta: `{ txHash, offerSequence }`
   - Observação: o destino é sempre `TREASURY_VAULT_ADDRESS` (colateral V2).

3. EscrowFinish (libera para a vault do financiador)
   - `POST /api/escrow/finish`
   - Body: `{ owner, offerSequence }`
   - Resposta: `{ txHash, sequence }`

4. Antecipar 95% (Payment)
   - `POST /api/v1/sdk_p4yhu3/antecipar-escrow`
   - Body: `{ merchantWallet, value, owner, offerSequence }`
   - Resposta: `{ ok, txHash, sequence, financedAmount }`

## Segurança
- Assinatura exclusivamente no backend.
- JWT de curta duração obrigatório.
- Logger unificado registra `txHash` e `sequence` (sem segredos). Nas rotas serverless, use `api/_logger.js`.
- Endpoint EscrowFinish utiliza adapter KMS (`api/_kms-adapter.js`) para obter `XRPL_SEED` com isolamento de segredo.

## Observações
- Em produção, usar KMS para criptografar e desencriptar XRPL_SEED de forma efêmera.
- Frontend (`escrow-monitor.tsx`) envia apenas `{ owner, offerSequence }` para `finish`.
- Ambientes: `devnet` usa `wss://s.devnet.rippletest.net:51233`; `testnet` usa `wss://s.altnet.rippletest.net:51233`; `mainnet` usa `wss://xrplcluster.com`. Configure via `XRPL_NETWORK`.