# Quick Start — Integração em 30 minutos

## Objetivo
- Habilitar pipeline end-to-end: Figma → TRAE → GitHub → Vercel

## Passos Rápidos

1) Leia os guias (5 min)
```
cat FIGMA_GITHUB_TRAE_INTEGRATION_ANALYSIS.md
cat SETUP_VERCEL_GITHUB.md
```

2) Configure Vercel + Secrets (10 min)
- Crie `VERCEL_TOKEN`, obtenha `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`
- Adicione como secrets no GitHub

3) Push inicial (2 min)
```
git add .
git commit -m "feat(ci): add integration docs and vercel workflow"
git push origin main
```

4) Verifique o Deploy (5 min)
- Acesse os checks do GitHub → “Deploy to Vercel”
- Abra o link de preview/produção

5) Figma (opcional — 8 min)
- Duplique o Pitch para “Figma Design File”
- Envie novo `fileKey` alfanumérico
- Reexecutar import conforme `FIGMA-INTEGRATION.md`

## Pronto!
- Pipeline habilitado; PRs com preview automático
- Próxima melhoria: sincronizar tokens de design (Fase 2)