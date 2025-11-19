#!/bin/bash
# 🔍 PAYHUB - Find GitHub Project Script
# Usage: chmod +x find-github-project.sh && ./find-github-project.sh

set -e

echo "🚀 PAYHUB - GitHub Project Finder"
echo "================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get GitHub remote URL
echo "🔍 Verificando repositório remoto..."
if git remote -v | grep -q "origin"; then
    REMOTE_URL=$(git remote get-url origin)
    echo -e "${GREEN}✅ Repositório encontrado:${NC} $REMOTE_URL"
else
    echo -e "${YELLOW}⚠️  Nenhum repositório remoto encontrado${NC}"
    exit 1
fi

# Extract GitHub username and repo
if [[ $REMOTE_URL =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
    GITHUB_USER="${BASH_REMATCH[1]}"
    REPO_NAME="${BASH_REMATCH[2]}"
    echo -e "${GREEN}✅ Usuário GitHub:${NC} $GITHUB_USER"
    echo -e "${GREEN}✅ Repositório:${NC} $REPO_NAME"
else
    echo -e "${YELLOW}⚠️  URL do GitHub não reconhecida${NC}"
    exit 1
fi

# Build GitHub URLs
GITHUB_REPO_URL="https://github.com/$GITHUB_USER/$REPO_NAME"
GITHUB_ACTIONS_URL="https://github.com/$GITHUB_USER/$REPO_NAME/actions"
GITHUB_SECRETS_URL="https://github.com/$GITHUB_USER/$REPO_NAME/settings/secrets/actions"
GITHUB_ISSUES_URL="https://github.com/$GITHUB_USER/$REPO_NAME/issues"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${GREEN}✅ Branch atual:${NC} $CURRENT_BRANCH"

# Check if repo is private
if [[ $REMOTE_URL =~ git@ ]]; then
    ACCESS_TYPE="🔒 Privado (SSH)"
elif [[ $REMOTE_URL =~ https://.*@ ]]; then
    ACCESS_TYPE="🔒 Privado (HTTPS com token)"
else
    ACCESS_TYPE="🌐 Público"
fi
echo -e "${GREEN}✅ Tipo de acesso:${NC} $ACCESS_TYPE"

# Check Vercel integration
echo ""
echo "🔍 Verificando integração com Vercel..."
if command -v vercel >/dev/null 2>&1; then
    if vercel projects list | grep -q "$REPO_NAME"; then
        echo -e "${GREEN}✅ Projeto Vercel encontrado${NC}"
        VERCEL_PROJECTS=$(vercel projects list | grep "$REPO_NAME" | head -3)
        echo "$VERCEL_PROJECTS"
    else
        echo -e "${YELLOW}⚠️  Projeto Vercel não encontrado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI não instalado${NC}"
fi

# Check GitHub CLI
echo ""
echo "🔍 Verificando GitHub CLI..."
if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
        echo -e "${GREEN}✅ GitHub CLI autenticado${NC}"
        
        # Get repo info
        echo "📊 Informações do repositório:"
        gh repo view "$GITHUB_USER/$REPO_NAME" --json name,description,defaultBranch,visibility,primaryLanguage --jq '. | "Nome: \(.name)\nDescrição: \(.description // "Sem descrição")\nBranch padrão: \(.defaultBranch)\nVisibilidade: \(.visibility)\nLinguagem principal: \(.primaryLanguage // "Não especificada")"'
        
        # Get recent workflows
        echo ""
        echo "🔄 Workflows recentes:"
        gh run list --limit 5 --json status,conclusion,displayTitle,createdAt --jq '.[] | "\(.status) - \(.conclusion // "em andamento") - \(.displayTitle) - \(.createdAt)"' 2>/dev/null || echo "Nenhum workflow encontrado"
        
    else
        echo -e "${YELLOW}⚠️  GitHub CLI não autenticado${NC}"
        echo "Execute: gh auth login"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI não instalado${NC}"
fi

echo ""
echo "🎯 RESUMO EXECUTIVO:"
echo "==================="
echo -e "${BLUE}📁 Repositório:${NC} $GITHUB_REPO_URL"
echo -e "${BLUE}🚀 Actions:${NC} $GITHUB_ACTIONS_URL"
echo -e "${BLUE}🔐 Secrets:${NC} $GITHUB_SECRETS_URL"
echo -e "${BLUE}🐛 Issues:${NC} $GITHUB_ISSUES_URL"
echo -e "${BLUE}🌐 Branch:${NC} $CURRENT_BRANCH"

echo ""
echo -e "${GREEN}🎉 Informações coletadas com sucesso!${NC}"
echo ""
echo "📋 COPIE ESTAS INFORMAÇÕES PARA O TRAE:"
echo "======================================"
echo ""
echo "🎯 PAYHUB - GitHub Configuration"
echo "--------------------------------"
echo "GitHub User: $GITHUB_USER"
echo "Repository: $REPO_NAME"
echo "Branch: $CURRENT_BRANCH"
echo "Access: $ACCESS_TYPE"
echo "Repository URL: $GITHUB_REPO_URL"
echo "Actions URL: $GITHUB_ACTIONS_URL"
echo "Secrets URL: $GITHUB_SECRETS_URL"
echo ""
echo "✅ Status: Configuração identificada e pronta para integração!"
echo "🚀 Próximo passo: Executar script de setup do Vercel"