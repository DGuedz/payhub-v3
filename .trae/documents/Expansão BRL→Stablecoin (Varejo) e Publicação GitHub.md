# Ponte BRL → Stablecoin (Varejo) e Validação E2E

## Objetivo

* Estender o PAYHUB (P4YHU3) para o varejo, habilitando a compra de stablecoins (RLUSD/USDC/USDB) via PIX com liquidação na XRPL e Tesouraria Ativa (APY 5–8%).

* Publicar a documentação e o código no GitHub com clareza para revisão da equipe Ripple.

## Segurança e Conformidade

* KMS: manter `XRPL_SEED` exclusivamente em backend; carregamento via env/KMS; assinatura efêmera.

* JWT curto no HUB: proteger rotas críticas; adicionar rate limiting por IP/JWT.

* Logs/Auditoria: `txHash` e `sequence` sem PII; IDs de correlação; CSV compliance.

* Terminologia: Escrow (XRPL), RLUSD (Issued Currency), ODL, AMM, Sidechain EVM/mXRP.

## API On-Ramp (Varejo)

* `POST /api/v1/retail/onramp/pix/init`: inicia cobrança PIX (mock/PSP); retorna `chargeId`.

* `POST /api/v1/retail/onramp/pix/confirm`: confirma pagamento; retorna `approved: true`.

* `POST /api/v1/retail/onramp/convert`: BRL → RLUSD/USDC via AMM/Pathfinding; opções: RLUSD (IOU) e USDC/USDB; retorna `txHash/sequence/pathsCount`.

* Privacidade: opção de carteira efêmera XRPL como origem da conversão para dissociar identidade.

## Liquidação XRPL

* Trustline (Issued Currency): criar/validar trustline do destinatário para RLUSD.

* Pagamento/Conversão: usar `ripple_path_find` e `Payment` com `Paths` (AMM/DEX) para melhor taxa.

* Smart Escrow (opcional retail): `policy` (KYC/NFT) e `Condition/Fulfillment` para gating de liberação quando aplicável.

## Yield (Sidechain EVM)

* Adapter mXRP: implementar `stake()`, `unstake()`, `getApy()`; RPC PoA; carteira Tesouraria isolada.

* `POST /api/v1/retail/yield/activate`: abstrai complexidade; integra o adapter; retorna `activationId/status`.

## UI (Next.js)

* Página “Bridge BRL→Stablecoin”: formulário com valor em R$, seleção de stablecoin (RLUSD/USDC/USDB), botão “Comprar”, exibição de cotação e `txHash/sequence/pathsCount`.

* Integração MetaMask: conectar conta EVM e botão “Ativar Yield”.

* Reuso do painel “Testes XRPL”: manter ações (AMM Quote/Swap, LP, Trustline/Escrow) para validação interna.

## Observabilidade

* Dashboard: cards de `txHash/sequence`, `pathsCount`, taxa efetiva, APY, ROI/IL (LP), estado de empréstimos colateralizados.

* Endpoints de reporting: CSV de operações (`/api/v1/compliance/report`).

## Validação E2E

* Produção: setar envs (`JWT_SECRET`, `XRPL_SEED`, `RLUSD_ISSUER_ADDRESS`, `TREASURY_VAULT_ADDRESS`, `XRPL_NETWORK/WS`) e publicar `/api/xrp-payment`, `/api/cross-currency-payment`.

* Painel: executar Trustline → Conversão (AMM Swap) → opcional Smart Escrow → Yield.

* Evidências: coletar `txHash`, `sequence`, `pathsCount` e anexar ao relatório.

* Fallback: se TokenEscrow IOU indisponível no testnet, usar ciclo com XRP; manter IOU via Trustline + Payment do emissor.

## Publicação GitHub

* Repositório corrompido: usar clone limpo (`payhub-v3-fresh`), copiar arquivos modificados, `git add/commit/push` com mensagem clara.

* CI/CD: adicionar workflows (lint/build/audit/env-check); dependabot; version pinning.

## Documentação

* Atualizar `docs/RELATORIO_ANALISE_ESTRATEGICA.md` e `docs/XRPL_DEMO_RUNBOOK.md` com AMM/Smart Escrow/Yield e rotas publicadas.

* Exportar PDF: `pandoc -o RELATORIO_ANALISE_ESTRATEGICA.pdf docs/RELATORIO_ANALISE_ESTRATEGICA.md`.

## Cronograma

* Semana 1: envs produção, publicar Payment/CrossCurrency, validação painel.

* Semana 2: adapter AMM LP (deposit/withdraw) e cron HUB AI rebalance.

* Semana 3–4: adapter mXRP e integração ao `yield/activate`; Xumm OAuth.

* Semana 5: observabilidade (APY/ROI/IL), testes/CI, documentação viva.

## Riscos e Mitigações

* TokenEscrow IOU no testnet: mitigar com Payment/Trustline e ciclo XRP; documentar.

* KMS/Sidechain adapter: começar com mock controlado; endurecer acesso

* PSP/PIX: para MVP, simular aprovação; integrar PSPs na fase seguinte.

## Entregáveis

* Endpoints On-Ramp/Bridge, AMM, Yield; UI Bridge/MetaMask; documentação (MD/PDF); evidências de `txHash/sequence/pathsCount`; CI/CD.

