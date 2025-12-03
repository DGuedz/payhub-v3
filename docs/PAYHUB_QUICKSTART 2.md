# PAYHUB — Quick Start (VTC)

## Pré-requisitos
- Node.js 18+
- Variáveis de ambiente definidas (use `/.env.example` como base)
- Sem segredos em repositório; `.env.local` não deve ser versionado

## Configuração
1. Copie `/.env.example` para `.env.local`
2. Preencha `JWT_SECRET`, `XRPL_SEED` (via KMS/Vault), `RLUSD_ISSUER_ADDRESS`, `TREASURY_VAULT_ADDRESS`, `XRPL_NETWORK_WS`
3. Instale dependências: `npm install`

## Executar
- Inicie o servidor: `npm run dev`
- Acesse: `http://localhost:3001`

## Testes de API
- Subscription:
```
curl -X POST http://localhost:3001/api/v1/payment/vtc-subscription \
 -H "Authorization: Bearer <JWT>" \
 -H "Content-Type: application/json" \
 -d '{"planId":"Pro","paymentMethod":"PIX","vtcUserId":"user_123"}'
```
- Webhook (finish):
```
curl -X POST http://localhost:3001/api/webhooks/WEBHOOK_PAYHUB_TO_VTC \
 -H "Content-Type: application/json" \
 -d '{"owner":"rOwner...","offerSequence":12345,"vtcUserId":"user_123","planId":"Pro"}'
```

## Segurança
- Assinatura de `EscrowFinish` apenas no backend (KMS/ENV)
- JWT curto obrigatório nas rotas críticas
- Logs padronizados sem PII; auditoria por `txHash/sequence`

## Próximos Passos (Mainnet)
- Configurar `XRPL_NETWORK_WS` para mainnet
- Validar trustline RLUSD
- Executar teste ponta-a-ponta: EscrowCreate → EscrowFinish → Webhook
- Consultar Swagger: `docs/swagger/vtc-subscription.yaml`