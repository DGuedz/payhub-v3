## Objetivo
Construir o DApp Core (Next.js/TypeScript) orientado à Tesouraria que valida UX e o fluxo E2E do PAYHUB, espelhando GTreasury: Liquidez & Caixa, Tesouraria Ativa (Yield), Reconciliação/Conformidade e Integração/Auditoria. Garantir coesão entre frontend, proxies de API e backend (SDK_P4YHU3), com segurança institucional.

## Rotas e Layout
- `/` Home: Landing institucional navy `#001F3F` com CTAs para Cockpit e Segurança.
- `/app/dashboard` Cockpit: 4 painéis de teste consumindo endpoints validados.
- `/app/security` Monitor: simulação de Defesa Ativa/Honeypot.
- Layout comum minimalista, grids responsivos, feedback verde neon para sucesso e vermelho alerta para erros.

## Componentes Centrais
- Hook JWT: extrai `NEXT_PUBLIC_DEV_JWT` ou `localStorage.jwt_token` e injeta `Authorization: Bearer <JWT>`.
- Cliente de API: wrapper `fetch` com cabeçalhos, parse robusto e tratamento padronizado de erros (inclui 401/400/429).
- Cards/Painéis: componentes reativos com estados para `txHash`, `offerSequence`, `pathsCount` e métricas de saldo/APY.

## Pilares de Tesouraria (Espelho GTreasury)
### A. Gestão de Liquidez & Posição de Caixa
- Métricas: Saldo RLUSD (capital de giro), Previsão de fluxo (insights AR/AP tokenizados).
- Endpoints: `GET /api/merchant/info` (saldo, yieldRate), `GET /api/escrow/list` (pendentes para prever entradas).
- UI: Cards de saldo, forecast simplificado e indicador de liquidez D+0.

### B. Tesouraria Ativa (Yield Engine)
- Métricas: APY 5–8% (XRPL EVM Sidechain, mXRP), performance fee 10–20%.
- Ações: `POST /api/amm/quote` mostra `pathsCount`; `POST /api/amm/swap` inicia yield e retorna `txHash`.
- UI: Botões 3A/3B, estado de yield iniciado e métricas acumuladas.

### C. Reconciliação & Conformidade
- Monitor: `GET /api/escrow/list` exibe `txHash`/`OfferSequence` e status.
- Liquidação: 2A `POST /api/escrow/create` (Amount IOU RLUSD) → captura `offerSequence`; 2B `POST /api/escrow/finish` com `owner` e `offerSequence`.
- Economia de Taxas: gráfico comparando custo XRPL (~R$0,0001/tx) vs. rails tradicionais.

### D. Integração & Auditoria
- Reporting: `GET /api/reporting/logs` exibe trilhas (Escrow, Yield, Liquidação) com `txHash` e `sequence`.
- Exportar CSV: `GET /api/reporting/export.csv` baixa logs para compliance/auditoria.
- PAYHUB Connect: indicador de status (ERP/Sheets) e reconciliação automática.

## Integração de APIs (Proxies Next.js)
- Trustline RLUSD: `POST /api/odl/trustline-rlusd` → backend `/api/trustline-rlusd`.
- Escrow Create: `POST /api/escrow/create` → backend `/api/escrow-create`.
- Escrow Finish: `POST /api/escrow/finish` → backend `/api/escrow-finish`.
- Escrow List: `GET /api/escrow/list` (RPC XRPL somente leitura).
- AMM: `POST /api/amm/quote`, `POST /api/amm/swap` → backends correspondentes.
- Reporting: `GET /api/reporting/logs`, `GET /api/reporting/export.csv` (a adicionar no backend com simulação GTreasury).
- Cabeçalhos: forward de `Authorization` e `Content-Type`; `API_BASE_URL` via `.env.local`.

## Segurança e Conformidade
- KMS: XRPL_SEED somente em backend via env/KMS; nunca em frontend/banco/logs.
- Operações críticas (EscrowCreate/EscrowFinish) assinadas no servidor (`lib/xrpl-client.ts: finishEscrow(owner, offerSequence)`).
- Honeypot: carteiras isca e gatilho modular de invalidação de sessões (simulado no `/app/security`).
- Resiliência: try-catch global, handling de `429` com mensagens UX e retry exponencial quando aplicável.
- Auditoria: logar `txHash` e `OfferSequence` de todas as transações.

## UX e Feedback
- Paleta: navy `#001F3F`, sucesso `#00ff84`, alerta `#ff3355`.
- Estados visíveis: token válido, `txHash`, `offerSequence`, `pathsCount`, APY.
- Mensagens: sucesso/erro mostram resposta exata do backend.

## Telemetria e Logs
- Coletar operações (create/finish/swap/trustline) em store simples e expor em tabela.
- Export CSV a partir dos logs (campos: timestamp, tipo, `txHash`, `owner`, `offerSequence`, amount/value/currency, status).

## Validação e Testes
- Fluxo E2E: Trustline → EscrowCreate → EscrowFinish (3–5s) → AMM Quote → AMM Swap.
- Simulação GTreasury: após cada operação, acionar módulo de reporting (mock) e atualizar tabela/CSV.
- Testes manuais no Cockpit; adicionar smoke tests de rotas/proxies.

## Entregáveis
- Rotas e páginas: Home, Dashboard, Security.
- Cockpit funcional com 4 painéis e proxies de API.
- Monitor de Escrow e componentes de métricas (saldo/APY/forecast/fees).
- Export CSV e visualização de logs (simulação GTreasury).

## Próximos Passos
1) Implementar componentes/métricas dos 4 pilares no Dashboard.
2) Adicionar Reporting (logs e CSV) no backend e consumir via proxies.
3) Refinar gráficos (economia de taxas, forecast) e indicadores PAYHUB Connect.
4) Validar com dados reais devnet e revisar UX/segurança.

Confirma este plano para iniciar a implementação?