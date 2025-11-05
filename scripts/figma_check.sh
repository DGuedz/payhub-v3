#!/usr/bin/env bash
set -euo pipefail

# Checagem de acesso ao Figma e validação do FILE_KEY
# Requer:
#  - FIGMA_TOKEN (Personal Access Token do Figma)
#  - FIGMA_FILE_KEY (chave do arquivo Figma)

FIGMA_TOKEN=${FIGMA_TOKEN:-}
FIGMA_FILE_KEY=${FIGMA_FILE_KEY:-}

if [[ -z "$FIGMA_TOKEN" ]]; then
  echo "Erro: FIGMA_TOKEN não definido (export FIGMA_TOKEN=...)" >&2
  exit 1
fi

if [[ -z "$FIGMA_FILE_KEY" ]]; then
  echo "Erro: FIGMA_FILE_KEY não definido (export FIGMA_FILE_KEY=...)" >&2
  exit 1
fi

API_URL="https://api.figma.com/v1/files/${FIGMA_FILE_KEY}"

echo "[figma_check] Consultando ${API_URL}"
STATUS=$(curl -s -o /tmp/figma_file.json -w "%{http_code}" -H "X-Figma-Token: ${FIGMA_TOKEN}" "${API_URL}") || STATUS=$?

if [[ "$STATUS" != "200" ]]; then
  echo "Falha ao acessar Figma (HTTP $STATUS). Verifique FIGMA_TOKEN/FIGMA_FILE_KEY." >&2
  exit 2
fi

NAME=$(jq -r '.name // "(sem nome)"' /tmp/figma_file.json 2>/dev/null || echo "(jq indisponível)")
PUBLISH_DIR="design-system"
mkdir -p "$PUBLISH_DIR"
cp /tmp/figma_file.json "$PUBLISH_DIR/figma_file_info.json"

echo "OK: acesso ao Figma validado. Arquivo: ${NAME}"