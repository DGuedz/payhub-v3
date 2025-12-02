# Guia Manual de Push — PAYHUB V3

Quando os scripts não estiverem disponíveis ou falharem:

1) Valide o estado do repo
```bash
git status
git remote -v
```

2) Adicione os arquivos
```bash
git add AUDITORIA_*.md TRAE_*.md HANDOFF_SUMMARY.md README_PUSH_GITHUB.md pre-push-check.sh git-push-audit.sh
```

3) Commit institucional
```bash
git commit -m " Auditoria Financeira Completa - Series A Ready"
```

4) Push
```bash
git push origin main
```

Se o remote não estiver configurado:
```bash
git remote add origin <URL_DO_REPOSITORIO>
git push -u origin main
```