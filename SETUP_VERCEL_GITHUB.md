# Setup Vercel + GitHub (5 minutos)

Este guia habilita deploy automático (push → build → deploy) com previews em Pull Requests.

Monorepo: frontend (Next.js) em `payhub-frontend` e backend (Serverless API) na raiz. Serão dois projetos Vercel.

## Pré-requisitos
- Conta Vercel (gratuita)
- Repositório GitHub com acesso a Secrets
- Node 18+ para builds (no workflow)

## Passo-a-passo

1) Criar Projetos na Vercel
- Projeto Backend: importe o repo e defina `Root Directory: /` (raiz). Preset: `Other`.
- Projeto Frontend: importe novamente o mesmo repo e defina `Root Directory: payhub-frontend`. Preset: `Next.js`.
- Após criar, você terá `ORG_ID` e dois `PROJECT_ID` distintos.

2) Obter Secrets
- `VERCEL_TOKEN`: no dashboard Vercel → Settings → Tokens → “Create Token”
- `VERCEL_ORG_ID`: na URL/Settings da organização
- `VERCEL_PROJECT_ID`: Settings do projeto importado

3) Configurar Secrets no GitHub
- GitHub → Repo → Settings → Secrets and variables → Actions → New repository secret
- Adicione:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID_FRONTEND` (Next.js)
  - `VERCEL_PROJECT_ID_BACKEND` (Serverless API)

4) Primeiro Deploy Automático
- Faça `git push` para `main`:
```
git add .
git commit -m "chore(ci): add vercel deploy workflow"
git push origin main
```
- O workflow `Vercel Monorepo Deploy` executa dois deploys: frontend e backend.

5) Preview em Pull Requests
- Ao abrir um PR, o workflow cria um deployment de preview
- O link aparece nos checks do PR

## Variáveis de Ambiente (obrigatórias)
Configure nos dois projetos:

Frontend (Next.js):
- `API_BASE_URL` → URL do backend (ex.: `https://payhub-backend.vercel.app`)
- `NEXT_PUBLIC_XRPL_NETWORK` → `devnet` | `testnet`
- `NEXT_PUBLIC_ESCROW_OWNER_ADDRESS` → endereço público do owner

Backend (Serverless API):
- `XRPL_SEED` → via Secret/KMS (NUNCA expor)
- `RLUSD_ISSUER_ADDRESS` → emissor RLUSD
- `TREASURY_VAULT_ADDRESS` → destino de colateral
- `JWT_SECRET`, `JWT_ISSUER` → autenticação
- `XRPL_NETWORK` ou `XRPL_WS_URL` → rede XRPL

## Troubleshooting
- Passo de install falhou? Verifique se existe `package.json` (workflow é condicional)
- Build não roda? Sem `npm run build`, o step é ignorado (adicione script futuramente)
- Deploy pulou? Garanta que os 3 secrets estão configurados; sem eles o step é ignorado
- Sem framework? Use `Other`; é o modo genérico compatível

## Resultado Esperado
- Push na `main` → dois deploys (frontend e backend) em ~3 minutos
- Pull Requests → dois previews automáticos
- CDN + HTTPS por padrão

## Referências
- Vercel: https://vercel.com/docs
- GitHub Actions: https://docs.github.com/actions