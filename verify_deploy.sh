#!/usr/bin/env bash

# Payhub v3 - Deploy verification script
# Runs end-to-end checks against Vercel production and local build

DOMAIN=${DOMAIN:-https://payhub-v3.vercel.app}
REPORT=${REPORT:-deploy-report.log}

TS() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
PASSED=0
FAILED=0

log() { printf "%s %s\n" "$(TS)" "$1" | tee -a "$REPORT"; }
ok() { PASSED=$((PASSED+1)); log "✅ $1"; }
err() { FAILED=$((FAILED+1)); log "❌ $1"; }

echo "=== Payhub v3 deploy verification @ $(TS) ===" > "$REPORT"

log "Target domain: $DOMAIN"

# 1) Health endpoint (HEAD)
if curl -sI "$DOMAIN/api/health" | grep -q "200"; then
  ok "Health HEAD 200"
else
  err "Health HEAD not 200"
fi

# 2) Health endpoint (body)
HEALTH=$(curl -s "$DOMAIN/api/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  ok "Health body status ok"
else
  err "Health body missing/invalid"
fi

if command -v jq >/dev/null 2>&1; then
  echo "$HEALTH" | jq . | sed 's/^/   /' >> "$REPORT"
else
  echo "   (jq not installed; raw health): $HEALTH" >> "$REPORT"
fi

# 3) Homepage
if curl -sI "$DOMAIN/" | grep -q "200"; then
  ok "Homepage 200"
else
  err "Homepage not 200"
fi

# 4) Local build
if npm run build --silent >/dev/null 2>&1; then
  ok "npm build success"
else
  err "npm build failed"
fi

# 5) Vercel envs
if command -v vercel >/dev/null 2>&1; then
  if vercel env ls >/tmp/vercel_env_ls.txt 2>/tmp/vercel_env_ls.err; then
    ok "Vercel env listed"
    sed 's/^/   /' /tmp/vercel_env_ls.txt >> "$REPORT"
  else
    err "Vercel env ls failed"
    sed 's/^/   /' /tmp/vercel_env_ls.err >> "$REPORT"
  fi
else
  err "Vercel CLI not installed"
fi

# 6) CI workflows presence
WF_DIR=.github/workflows
if [ -d "$WF_DIR" ]; then
  ok "Workflows dir exists"
  ls -1 "$WF_DIR" | sed 's/^/   /' >> "$REPORT"
else
  err "Workflows dir missing"
fi

# 7) Old references scan
if git grep -n "PAYHUB_V3" >/tmp/old_refs.txt 2>/dev/null; then
  err "Old name references found (PAYHUB_V3)"
  sed 's/^/   /' /tmp/old_refs.txt >> "$REPORT"
else
  ok "No old name references (PAYHUB_V3)"
fi

# 8) Alias check (domain root)
if curl -sI "$DOMAIN" | grep -q "200"; then
  ok "Alias domain OK"
else
  err "Alias domain not responding 200"
fi

TOTAL=$((PASSED+FAILED))
echo "=== Summary: $PASSED passed, $FAILED failed, total $TOTAL ===" | tee -a "$REPORT"

exit $([ $FAILED -eq 0 ] && echo 0 || echo 1)
