# HubAI — n8n Workflows Overview (PAYHUB P4YHU3)

Este documento mapeia e padroniza os workflows n8n usados pelo HubAI para orquestração e compliance do PAYHUB.

## Sumário de Workflows
- HubAI Escrow Lifecycle: Cria e finaliza Escrow, aciona avanço (95%) e registra reporting/ERP.
- Compliance Report Export: Exporta CSV diário de compliance via API Gateway.
- ERP Reconcile: Reconciliação periódica com ERP (mock) via API Gateway.
- Yield Activation: Ativa módulo de Yield (XRPL EVM Sidechain) para comerciantes.
- Honeypot Security Alerts: Integra alertas de segurança (Defesa Ativa) com canal externo (SOC/API).

## Padrões de Segurança
- Nenhum segredo é armazenado nos workflows. O header `Authorization` usa `{{$env.PAYHUB_JWT}}`.
- Operações críticas (EscrowCreate/EscrowFinish) residem no backend; n8n somente orquestra chamadas.
- Logs e auditoria são padronizados no backend; n8n captura status e ids.

## Arquivos
- `n8n/workflows/hubai-escrow-lifecycle.json`
- `n8n/workflows/hubai-compliance-report.json`
- `n8n/workflows/hubai-erp-reconcile.json`
- `n8n/workflows/hubai-yield-activate.json`
- `n8n/workflows/hubai-honeypot-alerts.json`
- `n8n/WORKFLOWS_DOC.md` (documentação técnica e diagramas)
- `n8n/VALIDATION.md` (checklist e resultados de validação)