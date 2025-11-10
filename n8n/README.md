# HubAI — n8n Quickstart

Este guia padroniza a importação, configuração e validação dos workflows n8n do HubAI (PAYHUB P4YHU3).

## Pré-requisitos
- n8n ≥ v1.6
- Backend PAYHUB rodando em `http://localhost:3000` (ajuste conforme seu ambiente)
- JWT curto de acesso às rotas: defina `PAYHUB_JWT` no ambiente do n8n

## Variáveis de Ambiente (n8n)
- `PAYHUB_JWT`: token JWT curto (NUNCA versionar). Obtenha via login/mfa do backend.
- `BASE_URL`: base dos endpoints (ex.: `http://localhost:3000`).

## Variáveis de Ambiente (Backend)
- `XRPL_SEED`: carregado somente via env, nunca em código/logs.
- `RLUSD_ISSUER_ADDRESS`, `TREASURY_VAULT_ADDRESS`, `JWT_SECRET`, etc.

## Importação de Workflows
1. Abra o n8n e vá em Import.
2. Importe os arquivos em `n8n/workflows/*.json`:
   - `hubai-escrow-lifecycle.json`
   - `hubai-compliance-report.json`
   - `hubai-erp-reconcile.json`
   - `hubai-yield-activate.json`
   - `hubai-honeypot-alerts.json`
3. Ajuste as URLs/headers conforme seu ambiente (defina `BASE_URL`).

## Validação
- Execute `npm run n8n:validate` para checagem automática de:
  - Headers `Authorization` com `{{$env.PAYHUB_JWT}}`
  - Ausência de padrões sensíveis
  - Estrutura de nós e conexões

## Testes Manuais
- HubAI Escrow Lifecycle: disparo manual; confirmar EscrowCreate → EscrowFinish.
- Compliance Report: agendado 6h; execute manualmente para verificar.
- ERP Reconcile: agendado semanalmente; execute manualmente para validar payload.
- Yield Activation: manual; confirmar retorno de `activationId`.
- Honeypot Alerts: agendado por minuto; simule alertas e verifique envio ao SOC.

## Segurança e Compliance
- Nunca insira seeds/tokens nos JSONs.
- Operações críticas assinadas exclusivamente no backend.
- Log de auditoria centralizado no backend (hash/sequence), sem PII ou segredos.