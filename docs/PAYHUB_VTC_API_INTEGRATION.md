# PAYHUB × VTC — Documento Completo de Integração API (Mainnet Readiness)

## Visão Geral
- Objetivo: integrar o PAYHUB como gateway financeiro do VTC (PIX/Crypto/Cartão) com liquidação D+0 via Escrow RLUSD (Issued Currency/IOU).
- Tiers VTC: Starter (free), Pro ($49/mês), Elite ($149/mês). Meta: ~1.2K usuários → ~$35K MRR em 6 meses.
- Abstração: o HUB/API Gateway oculta a complexidade XRPL (Trustlines, chaves), com endpoints seguros e webhooks de provisionamento.

## Princípios de Segurança
- XRPL_SEED: carregada APENAS via variável de ambiente e protegida por KMS/Vault; nunca em código, logs ou banco.
- Assinatura: toda transação crítica (EscrowCreate/EscrowFinish) é executada exclusivamente no backend Node.js.
- JWT: rotas críticas protegidas por tokens de curta duração; validação via `MFAJWTSystem`.
- Logs/Auditoria: registro de `txHash` e `sequence` de todas as transações; sem PII/segredos.
- Defesa Ativa (Honeypot): carteiras isca podem invalidar sessões ativas ao serem acionadas.

## Arquitetura Técnica
- App Router Next.js: endpoints no frontend servem como proxy/lógica orquestradora.
- Cliente XRPL seguro: `src/backend/lib/xrpl-client.ts:31` finaliza Escrow com `finishEscrow(owner, offerSequence)`.
- Cliente de integração: `payhub-frontend/lib/XRPL_ESCROW_CLIENT.ts:1` cria escrow (mock seguro) e delega finish ao backend.
- Webhook: `payhub-frontend/app/api/webhooks/WEBHOOK_PAYHUB_TO_VTC/route.ts:1` notifica o VTC após `EscrowFinish`.
- Documentação: Swagger em `docs/swagger/vtc-subscription.yaml:1`.

## Fluxo Core (Liquidação Atômica)
1) Trustline RLUSD: estabelecer trustline entre MERCHANT_ACCOUNT e emissor de RLUSD (Issued Currency/IOU).
2) EscrowCreate (IOU RLUSD): valor do plano é travado. Amount no formato `{ currency, value, issuer }`.
3) EscrowFinish: finalização exige `Owner` e `OfferSequence` capturados na criação.
4) Webhook: PAYHUB envia notificação com `escrowHash/sequence` para o VTC realizar auto-provisioning.

## Endpoints
- `POST /api/v1/payment/vtc-subscription`
  - Função: iniciar o pagamento híbrido e criar Escrow RLUSD (mock seguro) com instruções para PIX/Card/Crypto.
  - Implementação: `payhub-frontend/app/api/v1/payment/vtc-subscription/route.ts:1`
  - Requisição: `{ planId: 'Starter'|'Pro'|'Elite', paymentMethod: 'PIX'|'Card'|'Crypto', vtcUserId: string }`
  - Resposta: `{ status, plan, amount, currency: 'USD', escrowHash, escrowSequence, owner, paymentMethod, paymentInstruction, paymentDetails, webhookUrl }`
  - Segurança: JWT curto obrigatório.

- `POST /api/webhooks/WEBHOOK_PAYHUB_TO_VTC`
  - Função: executar `EscrowFinish` no backend e notificar VTC.
  - Implementação: `payhub-frontend/app/api/webhooks/WEBHOOK_PAYHUB_TO_VTC/route.ts:1`
  - Requisição: `{ owner: string, offerSequence: number, vtcUserId: string, planId: string }`
  - Resposta: `{ ok: boolean, txHash?: string, sequence?: number, notified?: boolean }`
  - Segurança: backend assina com seed isolada (KMS/ENV).

## Especificação OpenAPI
- Arquivo: `docs/swagger/vtc-subscription.yaml:1`
- Segurança: `bearerAuth (JWT)`.
- Schemas: request com `planId`, `paymentMethod`, `vtcUserId`. Resposta com `escrowHash`, `escrowSequence`, `webhookUrl`.

## Variáveis de Ambiente (Produção/Mainnet)
- `JWT_SECRET`: segredo do JWT.
- `XRPL_SEED`: seed do operador (KMS/Vault; não versionar; descriptografar apenas ao assinar).
- `RLUSD_ISSUER_ADDRESS`: emissor da IOU RLUSD.
- `TREASURY_VAULT_ADDRESS`: destino da custódia/tesouraria.
- `XRPL_NETWORK_WS`: URL WebSocket da XRPL mainnet.
- `NODE_ENV=production`.

## Política de Resiliência
- Tratamento global de erros e retornos adequados.
- Backoff e retries para integrações externas; tratar `429 Too Many Requests` com retry/circuit breaker.
- Logs consistentes via `payhub-frontend/lib/logger.ts:35`.

## Padrões e Conformidade
- TypeScript no backend crítico; camelCase; sem `eval/new Function`.
- Auditoria: registrar hashes/sequences de XRPL; correlação por operação.
- ODL e DeFi: referência ao XRPL EVM Sidechain com mXRP para Yield 5–8% APY.
- Endpoint de Yield: `POST /api/v1/merchant/yield/activate` (abstrai complexidade DeFi para o comerciante).

## Testes Locais
- Dev server: `npm run dev` (porta padrão; ex.: http://localhost:3001).
- Exemplo `curl` (JWT necessário):
  - `curl -X POST http://localhost:3001/api/v1/payment/vtc-subscription -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" -d '{"planId":"Pro","paymentMethod":"PIX","vtcUserId":"user_123"}'`
  - `curl -X POST http://localhost:3001/api/webhooks/WEBHOOK_PAYHUB_TO_VTC -H "Content-Type: application/json" -d '{"owner":"rOwner...","offerSequence":12345,"vtcUserId":"user_123","planId":"Pro"}'`

## Ativação Mainnet (Checklist)
- Definir `XRPL_NETWORK_WS` para mainnet; validar conectividade.
- Configurar KMS/Vault e rotação de chaves; carregar `XRPL_SEED` via ENV segura.
- Confirmar trustline RLUSD em produção.
- Revisar rate limit e auditoria de logs.
- Executar testes de liquidação ponta-a-ponta (EscrowCreate → EscrowFinish → Webhook).

## Artefatos e Referências
- Cliente seguro: `src/backend/lib/xrpl-client.ts:31` (finishEscrow)
- Cliente integração: `payhub-frontend/lib/XRPL_ESCROW_CLIENT.ts:1`
- Endpoint subscription: `payhub-frontend/app/api/v1/payment/vtc-subscription/route.ts:1`
- Webhook PAYHUB→VTC: `payhub-frontend/app/api/webhooks/WEBHOOK_PAYHUB_TO_VTC/route.ts:1`
- Logger: `payhub-frontend/lib/logger.ts:35`
- Workflow (provisionamento): `workflow/vtc-plan-update-flow.ts:1`
- Swagger: `docs/swagger/vtc-subscription.yaml:1`
- Relatório Estratégico (atualizado): `docs/RELATORIO_ANALISE_ESTRATEGICA.md:80`

## Mensagem para Agente Senior Dev (Figma)
- Objetivo: garantir que a documentação e endpoints estejam prontos para mainnet.
- Texto sugerido:
  - "Publicamos a integração PAYHUB × VTC. Endpoints: `POST /api/v1/payment/vtc-subscription` e `POST /api/webhooks/WEBHOOK_PAYHUB_TO_VTC`. Assinatura crítica no backend com `XRPL_SEED` via KMS/ENV. Swagger em `docs/swagger/vtc-subscription.yaml`. Documento completo: `docs/PAYHUB_VTC_API_INTEGRATION.md`. Aguardando ativação mainnet (XRPL WS, trustline RLUSD, rotação de chaves)."

## Observações Finais
- Nenhum segredo em repositório; `.env.local` não versionado.
- Qualquer integração de Yield (mXRP) deve seguir o mesmo padrão de segurança.
- Após ativação mainnet, validar `escrowHash/sequence` no explorer e registrar evidências.