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