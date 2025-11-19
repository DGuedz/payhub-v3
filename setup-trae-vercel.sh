#!/bin/bash
# 🚀 PAYHUB - Setup Integração Trae + Vercel + GitHub
# Execute: bash setup-trae-vercel.sh

set -e

echo "🚀 PAYHUB - Setup Trae + Vercel + GitHub"
echo "========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo "🔍 Verificando requisitos..."
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js não encontrado${NC}"
        echo "Instale: https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm não encontrado${NC}"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ git não encontrado${NC}"
        exit 1
    fi
    
    if ! command -v gh &> /dev/null; then
        echo -e "${YELLOW}⚠️  GitHub CLI não encontrado${NC}"
        echo "Instale: https://cli.github.com/"
    fi
    
    echo -e "${GREEN}✅ Todos os requisitos encontrados${NC}"
}

# Install Vercel CLI
install_vercel_cli() {
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI instalado${NC}"
}

# Login to Vercel
vercel_login() {
    echo "🔐 Fazendo login no Vercel..."
    vercel login
    echo -e "${GREEN}✅ Login Vercel concluído${NC}"
}

# Link project to Vercel
link_vercel_project() {
    echo "🔗 Linkando projeto ao Vercel..."
    vercel link --yes
    echo -e "${GREEN}✅ Projeto linkado ao Vercel${NC}"
}

# Pull environment variables
pull_env_vars() {
    echo "📥 Baixando variáveis de ambiente..."
    vercel env pull .env.local
    echo -e "${GREEN}✅ Variáveis de ambiente baixadas${NC}"
}

# Create GitHub Secrets
create_github_secrets() {
    echo "🔐 Configurando secrets do GitHub..."
    
    if ! command -v gh &> /dev/null; then
        echo -e "${YELLOW}⚠️  GitHub CLI não encontrado. Configure manualmente:${NC}"
        echo "Adicione estes secrets em Settings → Secrets → Actions:"
        echo "- VERCEL_TOKEN"
        echo "- VERCEL_ORG_ID" 
        echo "- VERCEL_PROJECT_ID_FRONTEND"
        echo "- VERCEL_PROJECT_ID_BACKEND"
        echo "- SUPABASE_URL"
        echo "- SUPABASE_ANON_KEY"
        return
    fi
    
    echo "Por favor, forneça os valores dos secrets:"
    read -p "VERCEL_TOKEN: " VERCEL_TOKEN
    read -p "VERCEL_ORG_ID: " VERCEL_ORG_ID
    read -p "VERCEL_PROJECT_ID_FRONTEND: " VERCEL_PROJECT_ID_FRONTEND
    read -p "VERCEL_PROJECT_ID_BACKEND: " VERCEL_PROJECT_ID_BACKEND
    read -p "SUPABASE_URL: " SUPABASE_URL
    read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
    
    gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
    gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
    gh secret set VERCEL_PROJECT_ID_FRONTEND --body "$VERCEL_PROJECT_ID_FRONTEND"
    gh secret set VERCEL_PROJECT_ID_BACKEND --body "$VERCEL_PROJECT_ID_BACKEND"
    gh secret set SUPABASE_URL --body "$SUPABASE_URL"
    gh secret set SUPABASE_ANON_KEY --body "$SUPABASE_ANON_KEY"
    
    echo -e "${GREEN}✅ Secrets do GitHub configurados${NC}"
}

# Create workflow files
create_workflows() {
    echo "📁 Criando arquivos de workflow..."
    
    mkdir -p .github/workflows
    
    # Copy the deploy workflow
    if [ -f ".github/workflows/deploy-vercel.yml" ]; then
        echo -e "${GREEN}✅ Workflow já existe${NC}"
    else
        echo -e "${YELLOW}⚠️  Workflow não encontrado. Crie manualmente ou use o existente${NC}"
    fi
}

# Initial deployment
initial_deploy() {
    echo "🚀 Fazendo deploy inicial..."
    vercel --prod
    echo -e "${GREEN}✅ Deploy inicial concluído${NC}"
}

# Verify deployment
verify_deployment() {
    echo "🔍 Verificando deployment..."
    
    echo "Status do deployment:"
    vercel ls
    
    echo "Informações do projeto:"
    vercel inspect
    
    echo -e "${GREEN}✅ Verificação concluída${NC}"
}

# Main execution
main() {
    echo "Iniciando setup PAYHUB..."
    
    check_requirements
    
    echo -e "${YELLOW}"
    echo "Este script vai:"
    echo "1. Instalar Vercel CLI"
    echo "2. Fazer login no Vercel"
    echo "3. Linkar projeto"
    echo "4. Configurar secrets do GitHub"
    echo "5. Fazer deploy inicial"
    echo -e "${NC}"
    
    read -p "Deseja continuar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Setup cancelado."
        exit 1
    fi
    
    install_vercel_cli
    vercel_login
    link_vercel_project
    pull_env_vars
    create_github_secrets
    create_workflows
    initial_deploy
    verify_deployment
    
    echo -e "${GREEN}"
    echo "🎉 Setup completo!"
    echo "Próximos passos:"
    echo "1. Faça commit e push: git add . && git commit -m 'Setup Vercel' && git push"
    echo "2. Verifique o deploy em: https://vercel.com/dashboard"
    echo "3. Acesse sua aplicação na URL fornecida"
    echo -e "${NC}"
}

# Run main function
main "$@"