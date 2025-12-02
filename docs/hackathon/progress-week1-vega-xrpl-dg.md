Relatório de Progresso — PAYHUB (Semana 1)

Destinatários: Equipes Vega e XRPL
Autor: Diego Guedes (DG)
Período: 24/11–28/11

Sumário
- PAYHUB entrega liquidação D+0 com Escrow na XRPL usando RLUSD (Issued Currency/IOU). O fluxo integra PIX e cartão (à vista, parcelado, débito) ao API Gateway (HUB), que converte BRL→RLUSD via ODL, cria `EscrowCreate` IOU e finaliza com `EscrowFinish`. Todas as assinaturas ocorrem no backend com XRPL_SEED isolada em KMS/ENV e JWT curto nas rotas críticas. Auditoria registra `txHash/sequence` sem segredos.

Progresso Verificável
- Trustlines RLUSD criadas (merchant e tesouraria), emissão e transferência RLUSD, EscrowCreate/Finish (Devnet). Evidências:
  - Trustline merchant — tx: DFFD6A81678648C2076C55D1B9C12FF364D9F69E90C6FB59F23E441746846BDE — https://devnet.xrpl.org/transactions/DFFD6A81678648C2076C55D1B9C12FF364D9F69E90C6FB59F23E441746846BDE
  - Trustline tesouraria — tx: 19F730C3A50152FBD82386120C07C91CE2394211CD82947E9D62D8D1DE8C730D — https://devnet.xrpl.org/transactions/19F730C3A50152FBD82386120C07C91CE2394211CD82947E9D62D8D1DE8C730D
  - Emissão RLUSD — tx: 3EE5EF9F61BC1B8078011611E4E7B74B78E6D682FD69E33FDE06A85286321DEA — https://devnet.xrpl.org/transactions/3EE5EF9F61BC1B8078011611E4E7B74B78E6D682FD69E33FDE06A85286321DEA
  - EscrowCreate (IOU RLUSD) — tx: 22463226F023881F5626B486CB2C0E3F174F607019A5379FA19DB2FCB88E517F — https://devnet.xrpl.org/transactions/22463226F023881F5626B486CB2C0E3F174F607019A5379FA19DB2FCB88E517F
  - EscrowFinish — tx: 2B2B1EC33CC1A0CA649A8CAC60314578F145EE52BCC552286354ABFF7ADE0D1D — https://devnet.xrpl.org/transactions/2B2B1EC33CC1A0CA649A8CAC60314578F145EE52BCC552286354ABFF7ADE0D1D
  - Payment RLUSD — tx: 81B063A00AD70BA4D22893A31ECF969801BC60C75B1ACD0CDD87EBB8ABFD3CE1 — https://devnet.xrpl.org/transactions/81B063A00AD70BA4D22893A31ECF969801BC60C75B1ACD0CDD87EBB8ABFD3CE1

Arquivos de Evidência
- JSON consolidado: `docs/ARTIFACTS_DEVNET_REAL.json` (hashes, sequences, owner, offerSequence, issuer)
- CSV rastreável: `docs/testnet-audit/transactions.csv` (com coluna `explorer_url`)

Entregáveis Semana 1
- PIX QR dinâmico com callback → `EscrowCreate` IOU → `EscrowFinish` (backend-only signing).
- Cliente XRPL TypeScript seguro e rotas de API com JWT.
- Monorepo com dashboard Vite e proxy `/api`.
- CI (lint, typecheck, emoji guard) e Ruleset GitHub (PR obrigatório, histórico linear, commits assinados, checks).
- Pasta de auditoria com evidências verificáveis.

Arquitetura e Segurança
- XRPL_SEED isolada via KMS/ENV, nunca persistida ou logada; assinatura efêmera no servidor.
- Rotas críticas: somente backend (e.g., `/api/escrow-finish`), front envia `owner/offerSequence` sem chave.
- Logs padronizados, sem PII/segredos; auditoria por `txHash/sequence`.

Próximos Passos (Semana 2)
- Executar mesma trilha em Testnet e comparar métricas de latência/liquidação.
- Expandir simulação de cartão parcelado e reconciliação ERP.
- Ativar `POST /api/v1/merchant/yield/activate` e monitorar APY (mXRP 5–8%).
- Endurecer Ruleset com code scanning e checks dedicados por job.

Contato
- Diego Guedes (DG) — PayHub
- Repositório: https://github.com/DGuedz/payhub-v3
