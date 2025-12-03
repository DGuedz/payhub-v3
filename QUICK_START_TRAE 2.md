#  PAYHUB - Quick Start Trae + Vercel

##  3 Passos para Deploy Automático

### 1. COPIAR SCRIPT PARA TRAE
```bash
# Abra este arquivo e copie TUDO
cat TRAE_SCRIPT.txt

# Cole no chat do Trae e execute
```

### 2. CONFIGURAR SECRETS (2 min)
```bash
# No GitHub: Settings → Secrets → Actions
gh secret set VERCEL_TOKEN --body "seu_token"
gh secret set VERCEL_ORG_ID --body "sua_org"
gh secret set VERCEL_PROJECT_ID_FRONTEND --body "id_frontend"
gh secret set VERCEL_PROJECT_ID_BACKEND --body "id_backend"
```

### 3. DEPLOY (1 min)
```bash
# Deploy manual inicial
vercel --prod

# Verificar
curl https://payhub-v3.vercel.app/api/health
```

##  PRONTO!

-  Push automático → Deploy
-  Preview URLs em PRs
-  Health checks automáticos
-  Figma sync integrado

**Tempo total: ~5 minutos** 

##  Se Precisar

1. Verifique `TRAE_SETUP_GUIDE.md` para detalhes
2. Execute `./setup-trae-vercel.sh` para setup completo
3. Verifique logs: `vercel logs`

---

**Deploy automático configurado!** 