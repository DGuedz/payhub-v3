# PAYHUB V3 — Simulação Completa (Devnet/Testnet XRPL)

Este guia documenta uma simulação end-to-end em ambiente `devnet/testnet` usando o mecanismo nativo de Escrow da XRPL com RLUSD (Issued Currency/IOU), incluindo Trustline, EscrowCreate, Antecipação 95% (Payment fora do Escrow) e EscrowFinish.

## 1. Pré-requisitos
- Backend ativo: `node server.js` (porta `3000` por padrão).
- Frontend (opcional): `npm run dev` (porta `3001`).
- Variáveis de ambiente (sem segredos versionados):
  - `XRPL_NETWORK` (ex.: `devnet` ou `testnet`), ou `XRPL_WS_URL` para override.
  - `RLUSD_ISSUER_ADDRESS` (pública).
  - `TREASURY_VAULT_ADDRESS` (destino da custódia V2 — vault do financiador).
  - `JWT_SECRET` para emissão/validação de JWT.
  - `XRPL_SEED` e opcional `XRPL_SEED_FUNDING` — somente via env; nunca em arquivos.
- Gerar JWT curto:
  - `node scripts/generate-jwt.js` (usa `JWT_SECRET`).

## 2. Fluxo por cURL

### 2.1 Trustline RLUSD
```bash
curl -X POST http://localhost:3000/api/trustline-rlusd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"limit":"1000"}'
```
Esperado: `ok: true`, `txHash`, `sequence`.

### 2.2 EscrowCreate (IOU RLUSD — destino: vault do financiador)
```bash
curl -X POST http://localhost:3000/api/escrow-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"value":"1000.00","destination":"<TREASURY_VAULT_ADDRESS>"}'
```
Copie `offerSequence` (identificador do Escrow) e `txHash`.

### 2.3 Antecipar 95% (Payment fora do Escrow)
```bash
curl -X POST http://localhost:3000/api/v1/sdk_p4yhu3/antecipar-escrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"merchantWallet":"<ADDRESS_COMERCIANTE>","value":"1000.00","owner":"<ADDRESS_OWNER>","offerSequence":<NÚMERO>}'
```
Esperado: `ok: true`, `txHash`, `sequence`, `financedAmount: "950.00"`.

### 2.4 EscrowFinish (Liquidação)
```bash
curl -X POST http://localhost:3000/api/escrow-finish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"owner":"<ADDRESS_OWNER>","offerSequence":<NÚMERO>}'
```
Esperado: `ok: true`, `txHash`, `sequence`.

## 3. Fluxo automatizado (Smoke Demo)

### 3.1 Comando direto
```bash
BASE_URL=http://localhost:3000 \
TOKEN="<JWT_CURTO>" \
DESTINATION_ADDRESS="<ADDRESS_COMERCIANTE>" \
OWNER_ADDRESS="<ADDRESS_OWNER>" \
OUTPUT_FILE=docs/ARTIFACTS_DEVNET.json \
node scripts/xrpl-smoke-demo.js
```
- O script encadeia: `Trustline -> EscrowCreate -> Antecipar 95% -> EscrowFinish`.
- Artefatos gravados em `docs/ARTIFACTS_DEVNET.json`.

### 3.2 Comando npm
```bash
TOKEN="<JWT_CURTO>" DESTINATION_ADDRESS="<ADDRESS_COMERCIANTE>" OWNER_ADDRESS="<ADDRESS_OWNER>" \
  npm run demo:artifacts
```

## 4. Artefatos e verificação
- Arquivo: `docs/ARTIFACTS_DEVNET.json` com `txHash`, `sequence`, `offerSequence`, `owner`, `destination`.
- Verifique no explorer:
  - Testnet: `https://testnet.xrpl.org/transactions/<txHash>`
  - Devnet: `https://devnet.xrpl.org/transactions/<txHash>`

## 5. Segurança e Compliance
- Assinatura sempre no backend; chaves nunca em logs/arquivos.
- `XRPL_SEED`/`XRPL_SEED_FUNDING` somente via env; preferir KMS (AWS KMS/Vault) para produção.
- Rotas críticas exigem JWT curto; auditoria registra `txHash`/`sequence` sem segredos.

## 6. Orquestração n8n (opcional)
- Importar `n8n/workflows/*.json`.
- Definir `PAYHUB_JWT` e `BASE_URL` no ambiente do n8n.
- Validar: `npm run n8n:validate`.

## 7. Solução de problemas
- `429` ou tempo de rede: repetir com intervalos; as rotas usam `withRetry`.
- Falta de env: conferir `.env.example` e runbooks.
- Seed ausente: ver `api/_kms-adapter.js` e `src/backend/security/kms-adapter.ts`.