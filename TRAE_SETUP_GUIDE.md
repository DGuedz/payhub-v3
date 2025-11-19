# 🚀 PAYHUB - Setup Trae + Vercel + GitHub Actions

## 📋 Visão Geral

Este guia configura deploy automático do PAYHUB com:
- ✅ **Deploy automático** a cada push
- ✅ **Preview URLs** para PRs
- ✅ **Monorepo** (frontend + backend)
- ✅ **Figma sync** automático
- ✅ **Health checks** pós-deploy

## 🎯 Arquitetura

```
PAYHUB/
├── .github/workflows/
│   ├── deploy-vercel.yml      # Deploy automático
│   ├── figma-sync.yml         # Sync Figma tokens
│   └── backend-test.yml       # Testes Supabase
├── payhub-frontend/           # Next.js frontend
├── api/                       # Backend Vercel functions
├── vercel.json               # Config Vercel
└── setup-trae-vercel.sh     # Script setup
```

## 🔧 Configuração Passo-a-Passo

### 1. Preparar Ambiente

```bash
# Verificar requisitos
node --version && npm --version && git --version

# Instalar Vercel CLI
npm install -g vercel

# Login Vercel
vercel login
```

### 2. Configurar Secrets no GitHub

Vá para: Settings → Secrets → Actions → New repository secret

```bash
# Adicionar estes secrets:
VERCEL_TOKEN=seu_token_vercel
VERCEL_ORG_ID=sua_org_id
VERCEL_PROJECT_ID_FRONTEND=id_do_projeto_frontend
VERCEL_PROJECT_ID_BACKEND=id_do_projeto_backend
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_chave_anon
FIGMA_TOKEN=seu_token_figma
FIGMA_FILE_KEY=UQwbW2cybw7SGzlBWHlgcr
```

### 3. Configurar Variáveis no Vercel

Frontend (payhub-frontend project):
```
API_BASE_URL=https://payhub-backend.vercel.app
NEXT_PUBLIC_XRPL_NETWORK=devnet
NEXT_PUBLIC_ESCROW_OWNER_ADDRESS=seu_endereco_publico
```

Backend (root project):
```
XRPL_SEED=via_KMS_nunca_exponha
RLUSD_ISSUER_ADDRESS=endereco_emissor_rlusd
TREASURY_VAULT_ADDRESS=endereco_tesouraria
JWT_SECRET=seu_jwt_secret_seguro
JWT_ISSUER=payhub-v3
XRPL_NETWORK=devnet
```

### 4. Executar Setup Script

```bash
# Tornar executável
chmod +x setup-trae-vercel.sh

# Executar setup completo
./setup-trae-vercel.sh

# Verificar secrets
gh secret list
```

### 5. Testar Deploy

```bash
# Deploy manual inicial
vercel --prod

# Verificar status
vercel ls
vercel inspect

# Health check
curl https://payhub-v3.vercel.app/api/health
```

### 6. Commit e Push

```bash
git add .
git commit -m "🚀 Setup Vercel + GitHub Actions complete"
git push origin main
```

## 📊 Monitoramento

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Vercel Dashboard | https://vercel.com/dashboard | Deploys e logs |
| GitHub Actions | https://github.com/DGuedz/PAYHUB_V3/actions | Workflows |
| Health Check | https://payhub-v3.vercel.app/api/health | Status API |
| Preview URLs | Nos PRs | Ambientes de teste |

## 🚨 Troubleshooting

### Deploy Falhou
```bash
# Ver logs
vercel logs

# Ver secrets
gh secret list

# Testar local
npm run build
```

### Health Check Falhou
```bash
# Verificar api/health.js
curl -v https://payhub-v3.vercel.app/api/health

# Ver variáveis
vercel env ls
```

### Preview URL Não Gerada
```bash
# Verificar PROJECT_IDs
echo $VERCEL_PROJECT_ID_FRONTEND
echo $VERCEL_PROJECT_ID_BACKEND

# Ver workflow
gh run list
```

## 🎯 Fluxo de Trabalho Completo

1. **Developer push** → GitHub
2. **GitHub Actions** → Build + Test
3. **Vercel** → Deploy Frontend + Backend
4. **Health Check** → Verifica deploy
5. **Preview URL** → Comentado no PR
6. **Production** → Deploy automático

## 📱 Comandos Úteis

```bash
# Deploy manual
vercel --prod

# Ver logs
vercel logs --follow

# Rollback
vercel rollback

# Environment
vercel env pull .env.local
vercel env ls

# GitHub Actions
gh run list
gh run view --log
```

## 🎉 Resultado

✅ **Push na main** → Deploy automático (~3 min)
✅ **PR aberto** → Preview URL disponível
✅ **Figma update** → Tokens sincronizados
✅ **Health check** → Sistema verificado
✅ **Rollback** → 1 clique no Vercel

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs no Vercel
2. Confira os secrets no GitHub
3. Execute health checks
4. Consulte este guia

---

**Pronto para produção!** 🚀