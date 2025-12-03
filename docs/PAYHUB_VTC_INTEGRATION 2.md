# Integração PAYHUB × VTC (Vibe Trade Copilot)

## Arquitetura
- Endpoint: `POST /api/v1/payment/vtc-subscription` (JWT protegido)
- Liquidação: `EscrowCreate` RLUSD (IOU) → `EscrowFinish` no backend
- Webhook: `POST /api/webhooks/WEBHOOK_PAYHUB_TO_VTC` notifica provisionamento
- Auditoria: `escrowHash` e `sequence` registrados para rastreabilidade

## Fluxo
1. VTC envia plano (`Starter/Pro/Elite`) e método (`PIX/Card/Crypto`)
2. PAYHUB calcula valor e cria `EscrowCreate` RLUSD (mock seguro)
3. Usuário paga; PAYHUB executa `EscrowFinish` no backend
4. Webhook envia confirmação ao VTC com `escrowHash`

## Segurança
- `XRPL_SEED` via ENV/KMS; nunca em código, DB ou logs
- JWT curto para rotas críticas; MFA opcional via `MFAJWTSystem`
- Logs padronizados; sem PII/segredos

## Metas e MRR
- Tiers: Starter (free), Pro ($49/mês), Elite ($149/mês)
- Target: 1.2K usuários → ~$35K MRR em 6 meses

## Endpoints
- `POST /api/v1/payment/vtc-subscription`
- `POST /api/webhooks/WEBHOOK_PAYHUB_TO_VTC`

## Swagger
- Especificação: `docs/swagger/vtc-subscription.yaml`