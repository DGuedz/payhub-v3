Relatório de Progresso — PAYHUB (Semana 1)

Destinatários: Equipes Vega e XRPL
Autor: Diego Guedes (DG)
Período: 24/11–28/11

Sumário Executivo
- PAYHUB entrega liquidação D+0 com Escrow na XRPL usando RLUSD (Issued Currency/IOU). O HUB converte BRL→RLUSD via ODL, cria `EscrowCreate` IOU e finaliza com `EscrowFinish`. Assinaturas apenas no backend (XRPL_SEED via KMS/ENV), JWT curto nas rotas críticas e auditoria por `txHash/sequence`.

Atividades e Entregáveis
- PIX QR dinâmico com callback: `server.js:72–95`; rotas: `api/payment-pix.js`, `api/payment-pix-callback.js`.
- EscrowCreate/Finish no backend: `api/escrow-create.js:56`, `api/escrow-finish.js:52`.
- Cliente XRPL seguro: `src/backend/xrpl/xrpl-client.ts:41`, `:64`, `:95`.
- Monorepo + dashboard Vite; proxy `/api`.
- CI: `.github/workflows/ci.yml:1` (`npm ci`, `check:emoji`, `lint`, `typecheck`).
- Ruleset GitHub (PR obrigatório, histórico linear, commits assinados, checks).
- Evidências Devnet: `docs/ARTIFACTS_DEVNET_REAL.json` e `docs/testnet-audit/transactions.csv`.

KPIs Iniciais
- Sucesso de EscrowFinish (D+0), latência callback PIX→EscrowFinish, integridade de auditoria por operação.

Segurança e Conformidade
- XRPL_SEED isolada em KMS/ENV; sem logs/PII.
- Backend‑only para transações críticas; front envia apenas `owner/offerSequence`.
- Resiliência: rate limit/CORS/try‑catch.

Próximos Passos
- Repetir trilha em Testnet e comparar KPIs/latência.
- Expandir simulação (parcelado) e reconciliação ERP.
- Ativar `POST /api/v1/merchant/yield/activate` (XRPL EVM Sidechain / mXRP 5–8% APY).

Links de Evidência
- Ver `./EVIDENCE.md` para hashes e URLs clicáveis (Devnet).
