# ROADMAP PAYHUB — Visão de Médio Prazo e Entregáveis (Q4 2025 → Q2 2026)

Este é o roteiro de execução para a fase de escalabilidade e consolidação do PAYHUB, marcando a transição de um projeto MVP vencedor de hackathon para uma solução de Fintech Híbrida Descentralizada com foco em Tesouraria Ativa (Yield) e Compliance de Nível Institucional. O plano prioriza a montagem do time principal, a integração de infraestruturas estratégicas (como Hidden Road e Metaco) e a monetização do Rendimento Ativo (5%–8% APY), conforme o modelo de negócio híbrido do PAYHUB.

## Entregáveis-Chave do Documento
- Documento Consolidado de Visão de Produto
- Roadmap de Médio Prazo (Q4 2025 → Q2 2026)
- Estrutura de comunicação definida (marcos, owners e KPIs)

## Fases e Entregáveis por Trimestre

### Q4 2025 — Institucionalização e Yield Core (90–180 dias)
**Foco Principal**
- Provar o núcleo financeiro em testnet: RLUSD + Escrow (D+0)
- Iniciar integração institucional: Custódia Metaco e Hidden Road (piloto)
- Preparar monetização do Yield (EVM Sidechain, mXRP)

**Montagem do Time & Prioridade**
- Captação: Grant não dilutivo (US$ 150K) para milestones de Produto e Growth
- Hiring: CTO/Lead Engineer; consultoria jurídica para Licença BACEN (40% Tech / 35% Legal/Team Prep)

**Entregáveis & Marcos (KPIs)**
- Core Financeiro Finalizado: Prova D+0 na Testnet com RLUSD Escrow (IOU)
- Infraestrutura Institucional (Pilotos):
  - Custódia Metaco (signing seguro, HSM/KMS)
  - Hidden Road Pilot (Financiamento Colateralizado)
- Yield Real (Dev/QA):
  - Implementar Yield Engine na XRPL EVM Sidechain (mXRP)
  - Dashboard exibe 5%–8% APY sobre saldo
- Segurança:
  - XRPL_SEED isolada por KMS/Vault (somente backend)
  - Auditoria de `txHash` e `sequence` de todas as transações XRPL

### Q1 2026 — Maturidade e Compliance Institucional
**Foco Principal**
- Consolidação legal e de compliance (estrutura da entidade e processo BACEN)
- Refatoração técnica para TypeScript e modularidade
- Testnet aberta e validação por terceiros

**Montagem do Time & Prioridade**
- Hiring: Gerente de Compliance; formalização da entidade
- Dev: Refatorar stubs para TypeScript; build integrado e modular

**Entregáveis & Marcos (KPIs)**
- Conformidade Regulamentar: Início formal da Licença BACEN; auditoria de código
- Reporting Layer — PAYHUB Connect:
  - `GET /api/v1/compliance/report` com exportação CSV (auditoria on-chain)
  - Consolidação de logs e trilhas de auditoria
- Testnet Aberta: Solução completa para stress testing e validação externa
- Dashboard de Reconciliação: GTreasury mock exibindo logs de Escrow e Yield

### Q2 2026 — Go-To-Market (GTM) e Tração
**Foco Principal**
- Escala comercial (B2B) e aquisição de âncoras (eventos/marketplaces)
- Parcerias e pilotos com 2–3 eventos âncora

**Entregáveis & Marcos (KPIs)**
- Lançamento Oficial (Mainnet): Tesouraria ODL do PAYHUB no Brasil
- Tração e Volume: 5K GMV (Gross Merchandise Volume)
- Monetização do Yield: Performance Fee (10%–20% do Yield) como receita primária
- Integração Contábil Completa: mock de `POST /api/v1/connect/erp/reconcile` (Reconciliação Automática)
- Expansão LatAm: Preparação para México/Colômbia

---

## Destaque Estratégico — Q4 2025 (Foco Semanal)
- Transformar POC em infraestrutura pronta para produção (Pré-GTM) alavancando ativos Ripple (Hidden Road, Metaco, GTreasury)
- Resolver dor de liquidez travada (D+30–D+60) e margem corroída por parcelamento, convertendo capital de giro em ativo produtivo

### Áreas de Foco e Entregáveis Imediatos (Q4 2025)
**Liquidez e Financiamento**
- Finalizar script seguro de `EscrowFinish` no backend (`api/escrow-finish.js`)
- Mock de `POST /api/v1/merchant/tokenize-receivable` para financiamento colateralizado (gera RCV-ID colateral)

**Tesouraria Ativa (Yield)**
- `POST /api/v1/merchant/yield/activate` no HUB (abstração da alocação de RLUSD excedente)
- Dashboard exibir claramente Rendimento Acumulado (5%–8% APY)

**Qualidade e Resiliência**
- AI Chat Handler Resiliente integrado: tratamento elegante de erro `429` e parsing de JSON seguro
- Chaves (`XRPL_SEED`) isoladas por KMS (sem segredos em código/logs/DB)

**GTM e Documentação**
- UVP no Pitch Deck: “Liquidez Imediata + Rendimento Ativo”
- Plano de Negócios Lite (3–5 páginas): Estratégia GTM e fundamentos do modelo

---

## Referências Técnicas e Endpoints
- EscrowCreate: `POST /api/escrow-create` — backend Node.js (assinatura em servidor)
- EscrowFinish: `POST /api/escrow-finish` — finalização segura (owner + offerSequence)
- Trustline RLUSD: `POST /api/trustline-rlusd` — limite/configuração da Issued Currency
- Yield Automático: `POST /api/v1/merchant/yield/activate` — ativação via HUB AI
- Compliance: `GET /api/v1/compliance/report` — geração de CSV com auditoria on-chain

Arquivos úteis já presentes no repositório:
- Backend JWT/Auth: `api/_auth.js:10`
- Escrow Create: `api/escrow-create.js:1`
- Escrow Finish: `api/escrow-finish.js:1`
- Trustline RLUSD: `api/trustline-rlusd.js:1`
- Compliance Report (frontend proxy → backend): `payhub-frontend/app/api/v1/compliance/report/route.ts:1`, backend `api/v1/compliance/report.js:1`
- Yield Activate (frontend proxy → backend): `payhub-frontend/app/api/v1/merchant/yield/activate/route.ts:1`, backend `api/v1/merchant/yield/activate.js:1`

---

## KPIs e Métricas de Sucesso
- D+0 validado em testnet (RLUSD IOU via Escrow): `txHash` e `sequence` auditáveis
- APY exibido em Dashboard (5%–8%) e cálculo de rendimento acumulado
- GMV: 5K até Q2 2026 (meta de tração)
- Performance Fee: 10%–20% do Yield (receita primária)
- Conformidade: início do processo BACEN, auditoria externa de código, relatórios CSV consistentes

## Segurança e Conformidade (Institucional)
- XRPL_SEED carregada exclusivamente por ENV/KMS; assinatura apenas no backend
- JWT curto (validação estrita) em rotas críticas
- Logs padronizados sem PII/segredos; auditoria de `txHash` e `sequence`
- Defesa Ativa (Honeypot): carteiras isca com invalidação de sessões ativas

## Dependências Técnicas
- XRPL (Escrow, Issued Currency/IOU RLUSD, Trustlines)
- EVM Sidechain (mXRP) para Yield Engine
- Metaco (custódia/HSM) e Hidden Road (financiamento colateralizado) — integrações piloto

## Owners e Responsáveis (Indicativos)
- CTO/Lead Engineer: entrega dos módulos Escrow/Yield/Compliance
- Jurídico/Compliance: processo BACEN, auditorias, Reporting Layer
- Produto/GTM: UVP, Plano de Negócios Lite, pilotos com eventos âncora

---

## Próximos Passos de Execução
- Ativar fluxo real em testnet: Trustline → EscrowCreate → EscrowFinish (endpoints protegidos por JWT)
- Medir APY e GMV; registrar métricas e logs de auditoria
- Preparar pilotos com Metaco e Hidden Road; consolidar documentação de evidências e readiness
