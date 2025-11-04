#!/usr/bin/env bash
set -euo pipefail

# secure_repo.sh
# Usage: chmod +x secure_repo.sh && ./secure_repo.sh
# WARNING: rewrites git history and does a force-push. Coordinate with team.

REPO_DIR="$(pwd)"
echo "Running in $REPO_DIR"

# 1) sanity checks
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: run this inside a git repo"
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

read -p "Create backup branch 'backup-before-clean'? [y/N] " REPLY
if [[ "$REPLY" =~ ^[Yy]$ ]]; then
  git branch -f backup-before-clean "$CURRENT_BRANCH"
  echo "Backup branch 'backup-before-clean' created."
fi

# 2) ensure git-filter-repo is available (preferred)
if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo not found. Attempting to install via brew..."
  if command -v brew >/dev/null 2>&1; then
    brew install git-filter-repo || true
  fi
fi

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo still not found. Install it manually: https://github.com/newren/git-filter-repo"
  exit 1
fi

# 3) create a replace-text file to redact patterns
REPLACE_FILE="$(mktemp)"
cat > "$REPLACE_FILE" <<'EOF'
# replace any direct OpenAI-like keys; replace whole token with [REDACTED_OPENAI_KEY]
sk-==>[REDACTED_OPENAI_KEY]
OPENAI_API_KEY==>[REDACTED_OPENAI_KEY]
# supabase or other service keys
SUPABASE_SERVICE_ROLE==>[REDACTED_SUPABASE_KEY]
SUPABASE_ANON_KEY==>[REDACTED_SUPABASE_KEY]
# generic placeholder for suspicious tokens starting with sk-
sk_==>[REDACTED_KEY]
EOF

echo "Replace file created: $REPLACE_FILE"

# 4) remove sensitive files from history: .env, .env.*, supabase/.env*, secrets file examples
git-filter-repo --invert-paths --paths .env --paths .env.local --paths .env.* --paths supabase/.env --paths supabase/.env.* --force || true

# 5) replace leaked tokens strings in history
git-filter-repo --replace-text "$REPLACE_FILE" --force

rm -f "$REPLACE_FILE"

# 6) add safe .gitignore entries (if not present)
GITIGNORE=".gitignore"
touch "$GITIGNORE"
grep -q "^\.env" "$GITIGNORE" || echo -e "\n# Local envs\n.env\n.env.*\n/.env\n" >> "$GITIGNORE"
grep -q "^supabase/config.toml" "$GITIGNORE" || echo "supabase/config.toml" >> "$GITIGNORE"
git add "$GITIGNORE"
git commit -m "chore: add secrets to .gitignore" || true

# 7) create pre-commit hook to block accidental secrets
HOOK_DIR=".git/hooks"
HOOK_FILE="$HOOK_DIR/pre-commit"
mkdir -p "$HOOK_DIR"
cat > "$HOOK_FILE" <<'HOOK'
#!/bin/sh
# simple pre-commit hook to block common keys in committed files
if git diff --cached --name-only | xargs grep -I --line-number -E "sk-|OPENAI_API_KEY|SUPABASE_SERVICE_ROLE|SUPABASE_ANON_KEY" >/dev/null 2>&1; then
  echo "ERROR: possible secret detected in staged files. Aborting commit."
  echo "Remove secret or add to .gitignore and try again."
  exit 1
fi
exit 0
HOOK
chmod +x "$HOOK_FILE"
echo "pre-commit hook installed."

# 8) force push rewritten history to origin
read -p "About to force-push rewritten history to origin. Continue? [y/N] " PROCEED
if [[ "$PROCEED" =~ ^[Yy]$ ]]; then
  git push origin --force --all
  git push origin --force --tags
  echo "Force-pushed rewritten history to origin."
else
  echo "Aborted before force-push. Local history rewritten but not pushed. Inspect locally."
fi

echo "Done. REMEMBER: rotate any keys you revoked/removed (OpenAI, Supabase, etc)."