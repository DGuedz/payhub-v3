# Secrets de CI/CD para PayHub v3

Este documento lista os secrets necessários no GitHub Actions e variáveis de ambiente no Vercel para sincronização de tokens do Figma e deploy automático.

## GitHub Actions — Repository Secrets

Adicione em `Settings → Secrets and variables → Actions`:

- `FIGMA_TOKEN`: Token de acesso do Figma (Personal Access Token).
- `FIGMA_FILE_KEY`: Chave do arquivo Figma. Ex.: `UQwbW2cybw7SGzlBWHlgcr`.
- `VERCEL_TOKEN`: Token de acesso do Vercel (User/Org token).
- `VERCEL_ORG_ID`: ID da organização no Vercel.
- `VERCEL_PROJECT_ID_FRONTEND`: ID do projeto Vercel do frontend.
- `VERCEL_PROJECT_ID_BACKEND`: ID do projeto Vercel do backend.

Opcional (se necessário pelo app):

- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (ou outras variáveis do backend/frontend).

### Dicas com GitHub CLI

Se usar `gh`:

```
gh secret set FIGMA_TOKEN --body "<seu_token_figma>"
gh secret set FIGMA_FILE_KEY --body "UQwbW2cybw7SGzlBWHlgcr"
gh secret set VERCEL_TOKEN --body "<seu_token_vercel>"
gh secret set VERCEL_ORG_ID --body "<sua_org_id>"
gh secret set VERCEL_PROJECT_ID_FRONTEND --body "<project_id_frontend>"
gh secret set VERCEL_PROJECT_ID_BACKEND --body "<project_id_backend>"
```

### Exemplos de valores (apenas ilustrativos)

```
# Figma
FIGMA_TOKEN=figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIGMA_FILE_KEY=UQwbW2cybw7SGzlBWHlgcr

# Vercel
VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_ORG_ID=org_xxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID_FRONTEND=prj_frontend_xxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID_BACKEND=prj_backend_xxxxxxxxxxxxxxxxx
```

## Vercel — Variáveis de Ambiente

No projeto Vercel, crie variáveis em `Settings → Environment Variables` (Production/Preview/Development):

- `FIGMA_TOKEN`: mesmo valor do secret de GitHub.
- `FIGMA_FILE_KEY`: `UQwbW2cybw7SGzlBWHlgcr`.
- Outras variáveis do app (ex.: `SUPABASE_URL`, `SUPABASE_ANON_KEY`).

## Fluxo recomendado

1. Push para `main`:
   - Executa verificação de Figma (`figma_check.sh`) e sincronização de tokens (`figma-tokens-sync.js`).
   - Gera artefatos (tokens enriquecidos/ CSS) como artifacts do workflow.
   - Executa deploy para Vercel com `VERCEL_*` secrets.

2. Pull Requests:
   - Roda os checks de Figma e sincronização para garantir consistência.
   - Cria previews no Vercel para revisão.

## Notas

- O identificador `figd_...` não substitui `FIGMA_FILE_KEY` nos scripts atuais; use o `file key` extraído da URL do Figma.
- Preencha o arquivo `.env.figmacheck` localmente com seus valores para rodar scripts de verificação e sincronização fora do CI.
