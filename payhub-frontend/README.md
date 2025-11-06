# PAYHUB Frontend (Next.js)

App Router em `app/` com página `(dashboard)/ticketing`.

Importa `src/components/merchant/LiquidarParceladoForm` do projeto raiz via `experimental.externalDir`.

## Dev

- `npm install`
- `npm run dev` (porta 3001)
- Configure `.env.local` com `NEXT_PUBLIC_DEV_JWT` (não versionado)

## Rotas

- `/` — home
- `/ticketing` — Criação de Eventos/Ticketing