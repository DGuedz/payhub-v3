# PAYHUB Frontend (Next.js)

App Router em `app/` com componentes ODL e monitor de Escrow.

## Componentes ODL

- `components/odl/ODLConversionForm` — Conversão ODL (BRL → RLUSD) e orquestração de Trustline + EscrowCreate via backend
- `components/odl/EscrowMonitor` — Leitura de escrows pendentes via XRPL RPC e ação de EscrowFinish
- `components/odl/ODLDashboard` — Integra conversão, monitor e métricas

## Dev

- `npm install`
- `npm run dev` (porta 3001)
- Backend local: `npm start` no projeto raiz (porta 3000)
- Configure `.env.local` (não versionado) — use o exemplo abaixo

### `.env.local` (exemplo)

```
API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_XRPL_NETWORK=devnet
NEXT_PUBLIC_ESCROW_OWNER_ADDRESS=rsXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Autenticação

- Geração de JWT curto: `JWT_SECRET=... node scripts/generate-jwt.js` (no projeto raiz)
- Salve o token no navegador antes de usar os fluxos: `localStorage.setItem('jwt_token', '<TOKEN>')`

## Rotas

- `/` — Dashboard ODL
- `/ticketing` — Criação de Eventos/Ticketing

## Segurança

- Segredos (XRPL_SEED, JWT_SECRET) nunca no frontend; somente backend/KMS
- Rotas críticas (EscrowCreate/EscrowFinish) são chamadas via proxy para o backend