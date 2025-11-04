# Setup Vercel + GitHub (5 minutos)

Este guia habilita deploy automático (push → build → deploy) com previews em Pull Requests.

## Pré-requisitos
- Conta Vercel (gratuita)
- Repositório GitHub com acesso a Secrets
- Node 18+ para builds (no workflow)

## Passo-a-passo

1) Criar Projeto na Vercel
- Acesse `https://vercel.com/new` e importe seu repo (PAYHUB_V3)
- Defina `Framework Preset: Other` (sem framework específico)
- Finalize para gerar: `ORG_ID` e `PROJECT_ID`

2) Obter Secrets
- `VERCEL_TOKEN`: no dashboard Vercel → Settings → Tokens → “Create Token”
- `VERCEL_ORG_ID`: na URL/Settings da organização
- `VERCEL_PROJECT_ID`: Settings do projeto importado

3) Configurar Secrets no GitHub
- GitHub → Repo → Settings → Secrets and variables → Actions → New repository secret
- Adicione:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

4) Primeiro Deploy Automático
- Faça `git push` para `main`:
```
git add .
git commit -m "chore(ci): add vercel deploy workflow"
git push origin main
```
- O workflow executa: checkout → install → type-check → build → deploy Vercel

5) Preview em Pull Requests
- Ao abrir um PR, o workflow cria um deployment de preview
- O link aparece nos checks do PR

## Variáveis de Ambiente (opcional)
- Configure envs no Vercel (Project → Settings → Environment Variables)
- Alternativamente, use `vercel env` via CLI

## Troubleshooting
- Passo de install falhou? Verifique se existe `package.json` (workflow é condicional)
- Build não roda? Sem `npm run build`, o step é ignorado (adicione script futuramente)
- Deploy pulou? Garanta que os 3 secrets estão configurados; sem eles o step é ignorado
- Sem framework? Use `Other`; é o modo genérico compatível

## Resultado Esperado
- Push na `main` → deploy em ~3 minutos
- Pull Requests → preview automático
- CDN + HTTPS por padrão

## Referências
- Vercel: https://vercel.com/docs
- GitHub Actions: https://docs.github.com/actions