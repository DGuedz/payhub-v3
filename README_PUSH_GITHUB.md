# PAYHUB V3 — Guia Rápido de Push para GitHub

Este guia envia o pacote institucional de auditoria e documentação.

## Método Rápido (Recomendado)

```bash
chmod +x pre-push-check.sh
./pre-push-check.sh

chmod +x git-push-audit.sh
./git-push-audit.sh
```

## Método Manual

```bash
git add .
git commit -m " Auditoria Financeira Completa - Series A Ready"
git push origin main
```

## Observações de Segurança
- Nunca exponha `XRPL_SEED`, KMS keys ou JWT secrets em código ou logs.
- Operações críticas on-chain são sempre no backend com chaves isoladas.
- Logs padronizados devem registrar `txHash`/`sequence` sem PII.