PAYHUB — Progresso Oficial (Vega/XRPL)

Mantenedor: Diego Guedes (DG)
Período: Semana 1 (24/11–28/11)

Escopo
- Liquidação D+0 via Escrow nativo da XRPL, usando RLUSD (Issued Currency/IOU).
- Integração PIX e cartão (à vista, parcelado, débito) ao API Gateway (HUB).
- Assinatura de transações exclusivamente no backend com XRPL_SEED isolada via KMS/ENV.

Documentos
- Relatório: ./REPORT_WEEK_01.md
- Evidências: ./EVIDENCE.md
- Artefatos JSON: ../.../../../docs/ARTIFACTS_DEVNET_REAL.json
- CSV de transações: ../.../../../docs/testnet-audit/transactions.csv

Como Verificar
- Rede: Devnet (links em EVIDENCE.md).
- Validar EscrowFinish com `owner` e `offerSequence` do EscrowCreate.
- Consultar hashes diretamente no explorer (cliques na EVIDENCE.md).
- Referências de código com rotas e cliente XRPL:
  - `api/escrow-create.js:56` (orquestra criação e auditoria)
  - `api/escrow-finish.js:52` (finalização segura no backend)
  - `src/backend/xrpl/xrpl-client.ts:64` (EscrowCreate IOU)
  - `src/backend/xrpl/xrpl-client.ts:95` (finishEscrow)

Conformidade e Segurança
- XRPL_SEED nunca em frontend, logs ou banco; apenas ENV/KMS.
- JWT curto nas rotas críticas; logs sem PII.
- Rate limit e CORS para resiliência.
