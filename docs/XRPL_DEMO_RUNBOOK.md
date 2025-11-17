# PAYHUB (P4YHU3) — XRPL Demo Runbook

Objetivo: Apresentar ao Júri a Arquitetura V2 — Escrow como colateral (protege o Fã) e antecipação D+0 (95%) fora do Escrow via Payment.

## Pré-requisitos
- Backend ativo: `node server.js` em `http://localhost:3000`.
- Frontend ativo: `npm run dev` em `http://localhost:3001`.
- `.env.local` preenchido conforme `.env.example` (sem segredos no repositório).
- Gerar JWT curto: `node scripts/generate-jwt.js`.

## Variáveis de Ambiente (resumo)
- `XRPL_NETWORK=testnet` ou `XRPL_WS_URL` override.
- `RLUSD_ISSUER_ADDRESS` (pública), `XRPL_SEED` (segredo tesouraria) e `XRPL_SEED_FUNDING` (financiamento) — ambos apenas no backend.
- `TREASURY_VAULT_ADDRESS` (destino do Escrow V2 — vault do financiador).
- `JWT_SECRET` e opcionalmente `JWT_ISSUER`, `JWT_MAX_AGE`.
- `NEXT_PUBLIC_DEV_JWT` apenas para DEV (frontend local).

## Comandos (CLI)
1. Trustline RLUSD
```
curl -X POST http://localhost:3000/api/trustline-rlusd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"limit":"1000"}'
```
Expect: `ok: true`, `txHash`, `sequence`. Auditoria sem segredos.

2. EscrowCreate (IOU RLUSD) — DESTINO: `TREASURY_VAULT_ADDRESS` (V2)
```
curl -X POST http://localhost:3000/api/escrow-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"value":"1000.00","finishAfterUnix":null}'
```
Copiar `offerSequence` (CPF do Escrow) e `txHash`. O destino é a vault do financiador (não o comerciante).

3. EscrowFinish (Liquidação — Dia do Evento)
```
curl -X POST http://localhost:3000/api/escrow-finish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"owner":"<ADDRESS_OWNER>","offerSequence":<NÚMERO>}'
```
Expect: `ok: true`, `txHash`, `sequence`.

4. Antecipar 95% (Payment fora do Escrow)
```
curl -X POST http://localhost:3000/api/v1/sdk_p4yhu3/antecipar-escrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"merchantWallet":"<ADDRESS_COMERCIANTE>","value":"1000.00","owner":"<ADDRESS_OWNER>","offerSequence":<NÚMERO>}'
```
Expect: `ok: true`, `txHash`, `sequence`, `financedAmount: "950.00"`.

## Script Único (Smoke Demo)
```
TOKEN=<TOKEN> DESTINATION_ADDRESS=<ADDRESS_COMERCIANTE> OWNER_ADDRESS=<ADDRESS_OWNER> \
  node scripts/xrpl-smoke-demo.js
```
Encadeia Trustline -> EscrowCreate (destino: vault) -> Antecipar 95% (Payment) -> EscrowFinish (repagamento ao financiador) com logs de auditoria.

## UX de Orquestração
- Acessar `http://localhost:3001/ticketing` e submeter o formulário.
- Valida `POST /api/v1/sdk_p4yhu3/liquidar-parcelado` com toasts, `operationId` e `txHash`.

## Segurança e Compliance
- `XRPL_SEED` e `XRPL_SEED_FUNDING` isoladas, criptografadas por KMS e decriptadas efemeramente.
- JWT curto obrigatório nas rotas críticas.
- Logger padronizado: `txHash`, `sequence`, `type`, `account`, `owner/destination`; nunca PII/segredos.

## Defesa e Resiliência
- Try-catch em todas as rotas; `withRetry` para `429/ECONNRESET/ETIMEDOUT`.
- Proposta de Honeypot: carteiras isca com invalidação modular de sessões.

## Yield (Stub)
- `POST /api/v1/merchant/yield/activate` — protegido por JWT; retorna `activationId` e `status=PENDING_ACTIVATION`.

## Artefatos de Teste (Testnet)
- Payment (XRP)
  - `txHash`: 3E67A468E7666FA742DEDCD772CA45A2152639F93AF3617990CF01E5DEA10DA0
  - `sequence`: 12333802, `ledger_index`: 12333802
  - `valor`: 1 XRP (1,000,000 drops)
  - `de`: rLRALC2o1H9KjxPBwZqvZKCkSSZh4vHzWB → `para`: rfaVipJwp8CWxCNzKRCeKKo5nn9j1cQJgj
  - `data (UTC)`: 2025-11-13T23:44:30Z
  - Explorer: https://testnet.xrpl.org/transactions/3E67A468E7666FA742DEDCD772CA45A2152639F93AF3617990CF01E5DEA10DA0

- EscrowCreate (XRP)
  - `txHash`: A3AC19EBF7C1B8056C93F08CB3BA46928EFF88C9008F876E1999271A8B3E02C9
  - `owner`: rGU8yv3QEjWNCSPcuQXt1L93uksfv8zM2H
  - `offerSequence`: 12334105
  - `FinishAfter` ≈ 10min, `CancelAfter` ≈ 1h

- Tokenização RLUSD (IOU) — Fluxo 1
  - `trustTxHash`: F9A9915A672CB1C39CD959547B07C518E5B6A411399C80C27EC67A6326957118
  - `owner`: rnhnihviGZwfVaP2qyqzxYEcbSrNKbqrJo
  - `issuer`: rpUMsoSRjyViHpjVSSyHHx8oQRm4yQw8kY
  - `vault`: rHC15VdrWqMFhdGsn1XYeQfGqJMyWkyjq4
  - `offerSequence`: 12334029 (tentativa de escrow RLUSD não validada no testnet)

- Tokenização RLUSD (IOU) — Fluxo 2
  - `trustTxHash`: 66CAF903EC504549EBF38739A169780A03442CA871E275ED812BC43F14D06A70
  - `issuanceTxHash`: DACB3BE1E31AC46FAD1145FCC4CC1B83E5A946CF10AA7FB47AE9D681EB0C1BE2
  - `owner`: rG8FSk3JYWA83LiyP6mVdwk6BJVocURpBT
  - `issuer`: rwNrWpcudbPawVihnmLGw1qo5QSLmpVGmu
  - `vault`: rKSc56Amzego2NwLQM9hPBzJbN7vJd1Hyu
  - `offerSequence`: 12334076 (tentativa de escrow RLUSD não validada no testnet)

### Observações
- Escrow de tokens (IOU) requer a emenda TokenEscrow e o emissor com `Allow Trust Line Locking` habilitado; no testnet público atual, `AccountSet.SetFlag=17` não é aceito, portanto `EscrowCreate` para IOU não valida.
- Fluxo end-to-end previsto em produção: Trustline → EscrowCreate → EscrowFinish, com assinatura exclusiva no backend e `JWT` curto.

## Resumo para Revisores (Ripple Dev Team)
- Segurança: assinatura XRPL apenas no backend via KMS (`XRPL_SEED` por env), rotas críticas com JWT curto, auditoria sem PII (`api/_logger.js:41`).
- Liquidez L1: Trustline (`api/trustline-rlusd.js:1`), EscrowCreate/Finish (`api/escrow-create.js:1`, `api/escrow-finish.js:1`), Payments (`api/xrp-payment.js:1`, `api/cross-currency-payment.js:1`).
- AMM/Pathfinding: `POST /api/amm/quote` e `POST /api/amm/swap` confirmam rotas e executam swaps com `Paths`.
- Smart Escrow: `policy` KYC/NFT e `Condition/Fulfillment` adicionam lógica programável com validação no finish.
- Sidechain (yield): ativação via `POST /api/v1/merchant/yield/activate`; integração mXRP planejada (adapter EVM).
