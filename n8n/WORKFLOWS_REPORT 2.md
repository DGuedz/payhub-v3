# Relatório de Análise — Workflows n8n (HubAI / PAYHUB P4YHU3)

## Escopo e Mapeamento
- Workflows versionados:
  - `hubai-escrow-lifecycle.json` — ciclo completo (Create → Finish → ERP → Compliance).
  - `hubai-compliance-report.json` — export diário de compliance.
  - `hubai-erp-reconcile.json` — reconciliação semanal ERP.
  - `hubai-yield-activate.json` — ativação de yield (manual).
  - `hubai-honeypot-alerts.json` — ingestão e filtro de alertas (SOC).

## Diagrama de Sequência (Principais)
- Ver diagramas em `n8n/WORKFLOWS_DOC.md` (Mermaid) para cada fluxo.

## Validação de Versionamento e Credenciais
- Todos os fluxos estão versionados em `n8n/workflows/*.json`.
- Headers `Authorization` utilizam `{{$env.PAYHUB_JWT}}` (JWT curto).
- Sem segredos em JSONs; endpoints do backend exigem JWT e realizam auditoria.
- Script de validação: `npm run n8n:validate` (estrutura/headers/padrões sensíveis).

## Testes e Funcionalidade
- Fluxos dependem dos endpoints:
  - `GET /api/v1/compliance/report` — funcional.
  - `POST /api/v1/connect/erp/reconcile` — funcional.
  - `POST /api/v1/merchant/yield/activate` — funcional.
  - `POST /api/escrow-create` e `POST /api/escrow-finish` — integrar com `src/backend/lib/xrpl-client.ts` conforme plano.
- Status esperado: respostas 200 e payloads conforme mocks existentes.

## Pontos de Melhoria
- Observabilidade no n8n: adicionar nós de `Function` para normalizar erros e tags de correlação (correlationId) entre nós.
- Resiliência: implementar backoff/jitter em chamadas HTTP (n8n Options) para mitigar 429/5xx.
- Segurança: reforçar verificação do domínio/URL via env do n8n (`BASE_URL`) para evitar hardcode.
- Compliance: versionar templates de payload (JSON Schema) para cada chamada, garantindo consistência.

## Sugestões de Otimização
- Agrupar chamadas ERP/Compliance pós EscrowFinish para reduzir latência total do fluxo.
- Cache local de tokens JWT curtos no n8n via credenciais temporárias (sem persistência em arquivo).
- Reutilizar nós comuns (HTTP headers padrão) via `Workflow Templates` do n8n.

## Redundâncias Identificadas
- Headers repetidos de `Authorization` e `Content-Type` em múltiplos nós: extrair para credenciais/nós utilitários.
- Transformações de datas em múltiplos fluxos: criar nó utilitário único para períodos (`periodStart/periodEnd`).

## Ações Recomendadas (Próximos Passos)
- Integrar `api/escrow-finish` com `xrpl-client.ts` para assinatura segura (backend).
- Adicionar `BASE_URL` no n8n e referenciar via env em todos os nós HTTP.
- Expandir `scripts/n8n-validate.js` para validar estrutura mínima de cada fluxo (nós obrigatórios).
- Criar dashboards n8n para status/latência por fluxo (Observabilidade).