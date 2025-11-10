#!/usr/bin/env bash
set -euo pipefail

bash ./pre-push-check.sh

echo "== PAYHUB V3 - Git Push Audit =="

# Seleciona arquivos principais de auditoria
FILES=(
  AUDITORIA_FINANCEIRA_FINAL.md
  AUDITORIA_CORRECOES_APLICADAS.md
  TRAE_BACKEND_AUDIT_REPORT.md
  TRAE_AUDIT_SCRIPT.md
  HANDOFF_SUMMARY.md
  GIT_PUSH_MANUAL.md
  README_PUSH_GITHUB.md
  AUDITORIA_EXECUTIVA_SUMMARY.md
  pre-push-check.sh
  git-push-audit.sh
)

echo "• Adicionando arquivos de auditoria ao índice"
git add "${FILES[@]}" || true

echo "• Criando commit institucional"
git commit -m "🔍 Auditoria Financeira Completa - Series A Ready" || echo "• Nenhum change para commit (pode já estar commitado)."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "• Enviando para origin/$BRANCH"
git push origin "$BRANCH"

echo "✓ Push concluído."