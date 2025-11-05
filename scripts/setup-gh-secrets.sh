#!/usr/bin/env bash
set -euo pipefail

# Script para configurar secrets do GitHub Actions usando GitHub CLI (gh)
# Uso:
#   1) Copie .env.ci.example para .env.ci e preencha os valores
#   2) Execute: bash scripts/setup-gh-secrets.sh [.env.ci]
#      (o arquivo padrão é .env.ci caso não seja informado)

ENV_FILE=${1:-.env.ci}

if ! command -v gh >/dev/null 2>&1; then
  echo "Erro: GitHub CLI (gh) não encontrado. Instale em https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Erro: GitHub CLI não autenticado. Rode 'gh auth login' e tente novamente." >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Erro: arquivo $ENV_FILE não encontrado. Crie a partir de .env.ci.example." >&2
  exit 1
fi

# Carregar variáveis do arquivo de env (formato KEY=VALUE por linha)
set -a
source "$ENV_FILE"
set +a

require_var() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "Erro: variável obrigatória $name não definida em $ENV_FILE" >&2
    exit 1
  fi
}

# Obrigatórias
require_var FIGMA_TOKEN
require_var FIGMA_FILE_KEY
require_var VERCEL_TOKEN
require_var VERCEL_ORG_ID
require_var VERCEL_PROJECT_ID

echo "Configurando secrets do GitHub Actions..."
gh secret set FIGMA_TOKEN --body "$FIGMA_TOKEN"
gh secret set FIGMA_FILE_KEY --body "$FIGMA_FILE_KEY"
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"

# Opcionais
if [ -n "${SUPABASE_URL:-}" ]; then
  gh secret set SUPABASE_URL --body "$SUPABASE_URL"
fi

if [ -n "${SUPABASE_ANON_KEY:-}" ]; then
  gh secret set SUPABASE_ANON_KEY --body "$SUPABASE_ANON_KEY"
fi

echo "Secrets configurados com sucesso."
