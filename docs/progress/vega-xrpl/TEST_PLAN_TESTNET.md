Plano de Teste — XRPL Testnet (PAYHUB)

Objetivo
- Validar trilha Trustline RLUSD → EscrowCreate IOU → EscrowFinish em Testnet, com auditoria e links verificáveis.

Pré‑requisitos
- Carregar segredos via ENV/KMS apenas no backend: `XRPL_SEED`, `RLUSD_ISSUER_ADDRESS`, `TREASURY_VAULT_ADDRESS`, `JWT_SECRET`.
- Rede: `XRPL_NETWORK=testnet`, `XRPL_WS_URL=wss://s.altnet.rippletest.net:51233`.

Arranque
- `PORT=3001 XRPL_NETWORK=testnet XRPL_WS_URL='wss://s.altnet.rippletest.net:51233' JWT_SECRET='dev' node server.js`
- Saúde: `curl -s http://localhost:3001/api/health`

Fluxo
1) Trustline RLUSD (merchant)
   - POST `/api/trustline-rlusd` com JWT curto
   - Capturar `txHash` e `sequence`
2) EscrowCreate IOU RLUSD
   - POST `/api/escrow-create` (Amount IOU `{currency:'RLUSD',issuer, value}`)
   - Capturar `txHash`, `owner`, `offerSequence`
3) EscrowFinish
   - POST `/api/escrow-finish` com `owner` e `offerSequence`
   - Capturar `txHash`, `sequence`

Evidências
- Registrar em `docs/testnet-audit/transactions.csv` (inclui `explorer_url`).
- Adicionar bloco em `docs/ARTIFACTS_TESTNET.json` (se aplicável).

Segurança
- Nunca expor `XRPL_SEED`; assinatura efêmera apenas no backend.
- Logs sem PII/segredos; auditoria por `txHash/sequence`.
