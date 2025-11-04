#!/usr/bin/env bash
set -euo pipefail

# Figma integration diagnostic for TRAE
# Usage:
#   export FIGMA_TOKEN="<your_pat>"
#   export FIGMA_FILE_KEY="<file_key>"
#   bash scripts/figma_check.sh

FIGMA_TOKEN=${FIGMA_TOKEN:-}
FIGMA_FILE_KEY=${FIGMA_FILE_KEY:-}
JQ=${JQ:-jq}

fail() { echo "[ERROR] $1"; exit 1; }
info() { echo "[INFO] $1"; }

[ -z "$FIGMA_TOKEN" ] && fail "FIGMA_TOKEN não definido. Crie um PAT em Figma > Settings > Personal access tokens."
[ -z "$FIGMA_FILE_KEY" ] && fail "FIGMA_FILE_KEY não definido. Copie da URL: https://www.figma.com/file/<FILE_KEY>/..."

info "Testando meta do arquivo (files endpoint)"
RESP1=$(curl -s -H "X-FIGMA-TOKEN: $FIGMA_TOKEN" "https://api.figma.com/v1/files/$FIGMA_FILE_KEY" || true)
if echo "$RESP1" | grep -q '"name"'; then
  if command -v $JQ >/dev/null 2>&1; then
    echo "$RESP1" | $JQ '{name: .name, last_modified: .lastModified, components_count: (.components|length)}'
  else
    echo "$RESP1"
  fi
else
  echo "$RESP1"
  fail "files/$FIGMA_FILE_KEY falhou. Possível token inválido (401/403) ou file_key incorreto (404)."
fi

info "Testando nodes (document root 0:1)"
RESP2=$(curl -s -H "X-FIGMA-TOKEN: $FIGMA_TOKEN" "https://api.figma.com/v1/files/$FIGMA_FILE_KEY/nodes?ids=0:1" || true)
if echo "$RESP2" | grep -q '"nodes"'; then
  if command -v $JQ >/dev/null 2>&1; then
    echo "$RESP2" | $JQ '.nodes["0:1"].document | {id: .id, name: .name, children_count: (.children|length)}'
  else
    echo "$RESP2"
  fi
else
  echo "$RESP2"
  fail "nodes endpoint falhou. Verifique escopo do token e acessos ao arquivo."
fi

info "Diagnóstico concluído com sucesso."
