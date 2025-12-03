## Objetivo
Integrar a estrutura App Shell proposta (SplashScreen, OnboardingXRPL, SoftPOSXRPL, DashboardXRPL, EscrowMonitorXRPL, InvestorDashboard, Navigation) ao Next.js, mantendo a **abstração total**, **resiliência UX** e **estética navy/verde** já validadas no Portal do Comerciante.

## Onde Integrar
- Manter `/app/merchant` como página principal do Portal.
- Criar componentes em `payhub-frontend/components/portal/*` e importar no `/app/merchant`.
- Alternativa: criar rota dedicada `/app/portal` com o App Shell e manter `/app/merchant` como alias (redirect).

## Componentes a Criar
1) `SplashScreen.tsx` (client)
- Tela inteira navy com logo/marca e CTA “Entrar no Portal”.
- Prop: `onComplete()` para avançar.

2) `OnboardingXRPL.tsx` (client)
- Coleta `JWT` (ou detecta `NEXT_PUBLIC_DEV_JWT`).
- Salva em `localStorage.jwt_token`; mostra badge de segurança (verde) e avança com `onAuthenticate()`.
- Mensagens de erro claras (401/429).

3) `SoftPOSXRPL.tsx` (client)
- Campo de valor (numpad/mobile-friendly), método (PIX/Cartão/QR).
- Botão único “[ RECEBER PAGAMENTO E LIQUIDAR D+0 ]”.
- Fluxo: `POST /api/odl/trustline-rlusd` → `POST /api/escrow/create` (Amount IOU RLUSD) → `POST /api/escrow/finish`.
- Toast sucesso (3–5s), loading spinner e logs mínimos internos.
- Fallback: se `/api/health` ou chamadas falharem, exibir “Serviços Temporariamente Indisponíveis”.

4) `DashboardXRPL.tsx` (client)
- Cartões: **Saldo RLUSD** e **Ganhos Ativos (APY 5–8%)**.
- Dados via `GET /api/merchant/info` (com Authorization); placeholders quando indisponível.

5) `EscrowMonitorXRPL.tsx` (client)
- Lista simples de escrows com `offerSequence`, `amount`, e link para explorer (devnet/testnet/mainnet).
- Fonte: `GET /api/escrow/list` (owner via env).

6) `InvestorDashboard.tsx` (client)
- Placeholder de yield (AMM: `POST /api/amm/quote`/`swap`), apenas botões de demonstração e métricas iniciais.

7) `Navigation.tsx` (client)
- Barra inferior mobile com tabs: POS, Dashboard, Escrow, Investor.
- Props: `currentView`, `onViewChange(view)`.

8) `AppShell.tsx` (client)
- Encapsula a lógica: `showSplash`, `isAuthenticated`, `currentView`.
- Usa os componentes acima; exportado e usado dentro de `/app/merchant`.

## Estética e Tokens
- Paleta: navy `#001F3F`, card `#0A2A52`, sucesso `#00FF84`, alerta `#FF3355`, texto `#FFFFFF`.
- Aplicar tokens via estilos inline (como já feito) ou CSS vars em `app/globals.css`.

## Resiliência UX
- Boot check: `GET /api/health` com timeout → estado `ok/degraded/down` e skeleton de boot.
- Loading states: spinner em todos os botões, desabilitar ações durante requests.
- Tratamento padrão: 401 (JWT ausente/inválido), 429 (sobrecarga com retry), 5xx (mensagem elegante).
- Fallback persistente quando backend indisponível.

## Segurança
- EscrowCreate/EscrowFinish somente via backend; nunca expor `XRPL_SEED` no front.
- JWT somente via env/localStorage; sem logs de segredos; headers Authorization repassados pelos proxies.

## Integração com proxies atuais
- Reutilizar `/api/odl/trustline-rlusd`, `/api/escrow/create`, `/api/escrow/finish`, `/api/escrow/list`, `/api/amm/quote`, `/api/amm/swap`, `/api/health`, `/api/merchant/info`.

## Validação
- Rodar em `http://localhost:3001/app/merchant`.
- Fluxo POS completo (valor → botão → toast → saldo atualizado).
- Dashboard mostra RLUSD/APY; Escrow monitor lista pendências.
- Fallback aparece quando backend está offline; navegação mobile fluida.

## Entregáveis
- Componentes criados em `components/portal/*`.
- Página `/app/merchant` usando o App Shell.
- UX consistente com navy/verde; estados de loading/fallback implementados.

Confirma para iniciar a implementação destes componentes e integração no `/app/merchant`?