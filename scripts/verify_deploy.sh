#!/usr/bin/env bash
set -euo pipefail

REPORT="deploy-report.log"
FIGMA_CHECK="./scripts/figma_check.sh"
HEALTH_URL=${HEALTH_URL:-"https://payhub-v3.vercel.app/api/health"}

echo "=== PAYHUB verify_deploy START $(date -u) ===" > "$REPORT"

# 1) Figma check (if exists)
if [ -x "$FIGMA_CHECK" ] || [ -f "$FIGMA_CHECK" ]; then
  echo "--- Running figma_check.sh ---" | tee -a "$REPORT"
  bash "$FIGMA_CHECK" 2>&1 | tee -a "$REPORT" || {
    echo "FIGMA_CHECK_FAILED" | tee -a "$REPORT"
  }
else
  echo "No figma_check.sh found, skipping." | tee -a "$REPORT"
fi

# 2) Local build
echo "--- Running npm ci && npm run build ---" | tee -a "$REPORT"
if command -v npm >/dev/null 2>&1; then
  npm ci || npm install
  if npm run build 2>&1 | tee -a "$REPORT"; then
    echo "BUILD_OK" | tee -a "$REPORT"
  else
    echo "BUILD_FAIL" | tee -a "$REPORT"
    exit 1
  fi
else
  echo "npm not found" | tee -a "$REPORT"; exit 1
fi

# 3) Smoke test health endpoint
echo "--- Testing health endpoint: $HEALTH_URL ---" | tee -a "$REPORT"
if curl -sSf "$HEALTH_URL" -o /dev/null; then
  echo "HEALTH_OK" | tee -a "$REPORT"
else
  echo "HEALTH_FAIL (curl non-zero)" | tee -a "$REPORT"
  curl -sS "$HEALTH_URL" | tee -a "$REPORT" || true
fi

echo "=== PAYHUB verify_deploy END $(date -u) ===" | tee -a "$REPORT"
echo "Report saved to $REPORT"
