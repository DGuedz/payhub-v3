# Validação de Workflows n8n — HubAI (PAYHUB P4YHU3)

Este documento comprova a versão, credenciais e funcionalidade dos workflows n8n incluídos.

## 1. Versionamento no repositório
- Todos os workflows estão versionados em `n8n/workflows/*.json`.
- Documentação central: `n8n/WORKFLOWS_OVERVIEW.md` e `n8n/WORKFLOWS_DOC.md`.

## 2. Credenciais
- JWT: os workflows utilizam `Authorization: {{$env.PAYHUB_JWT}}`.
- Configure `PAYHUB_JWT` no ambiente do n8n (sem persistir token no repositório).
- Backend: requer `XRPL_SEED`, `RLUSD_ISSUER_ADDRESS`, `TREASURY_VAULT_ADDRESS`, `JWT_SECRET` etc. via env.

## 3. Testes e Funcionalidade
- Importar os JSONs no n8n ≥ v1.6.
- Ajustar URLs para o ambiente (ex.: `http://localhost:3000`).
- Executar manualmente:
  - HubAI Escrow Lifecycle: valida create→finish e gera outputs ERP/Compliance.
  - Yield Activation: dispara ativação mock e retorna `activationId`.
  - Compliance Report Export: gera CSV mock.
  - ERP Reconcile: retorna `reconcileId` e `entries`.
  - Honeypot Alerts: filtra high e envia ao SOC.
- Resultado esperado: status 200 em cada chamada com payloads dos endpoints.

## 4. Validação Automatizada
- Script `scripts/n8n-validate.js` verifica:
  - Presença de cabeçalho Authorization referenciando `{{$env.PAYHUB_JWT}}`.
  - Ausência de padrões sensíveis (ex.: `sEd` de seeds XRPL, `Bearer ` hardcoded).
  - Existência dos nós principais em cada fluxo.

## 5. Observações de Segurança
- Nunca versionar tokens/JWT no repositório.
- Todos os segredos via variáveis de ambiente.
- Operações críticas assinadas exclusivamente no backend.