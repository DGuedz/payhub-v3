#!/usr/bin/env bash
set -euo pipefail

echo "== PAYHUB V3 - Pre Push Check =="

# Verifica se é um repositório git
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✖ Não é um repositório git."
  exit 1
fi

# Branch atual
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "• Branch atual: $BRANCH"
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
  echo "⚠ Você está em '$BRANCH'. O push enviará essa branch."
fi

# Remote origin
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "✖ Remote 'origin' não configurado. Configure com: git remote add origin <url>"
  exit 1
fi

# Status do working tree
echo "• Status do repositório:"
git status --short || true

# Varredura por possíveis segredos hardcoded (não exibe conteúdo)
echo "• Varredura rápida por possíveis segredos hardcoded..."
SENSITIVE_FILE="/tmp/p4y_sensitive.txt"
# Procura por padrões de XRPL seed (sEd...)
git grep -nE "sEd[0-9A-Za-z]{20,}" -- ':!docs' ':!README*.md' ':!**/.env*' > "$SENSITIVE_FILE" 2>/dev/null || true
if [ -s "$SENSITIVE_FILE" ]; then
  echo "✖ Possível segredo hardcoded encontrado em arquivos rastreados:"
  cat "$SENSITIVE_FILE"
  echo "Por segurança, aborte o push e sane os arquivos (use ENV + KMS)."
  exit 1
else
  echo "✓ Nenhum segredo hardcoded detectado em arquivos rastreados."
fi

echo "✓ Pre-push check concluído."