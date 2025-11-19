# Plano Consolidado de Integração — Figma • GitHub • Trae

Este documento descreve como conectar o design no Figma ao código no GitHub, automatizar sincronização de tokens e integrar o fluxo de desenvolvimento no Trae.

## Visão Geral
- Fonte de verdade de design: Figma (`FIGMA_FILE_KEY=UQwbW2cybw7SGzlBWHlgcr`).
- Automação CI/CD: GitHub Actions (`.github/workflows/sync-figma-tokens.yml`).
- Deploy: Vercel (via `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_FRONTEND`, `VERCEL_PROJECT_ID_BACKEND`).
- Desenvolvimento local: Trae IDE + scripts em `scripts/`.

## Secrets e Variáveis
- GitHub (Actions → Repository secrets):
  - `FIGMA_TOKEN`, `FIGMA_FILE_KEY`
  - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_FRONTEND`, `VERCEL_PROJECT_ID_BACKEND`
  - Opcionais: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Vercel (Settings → Environment Variables):
  - Replicar `FIGMA_TOKEN` e `FIGMA_FILE_KEY` se necessário pelo app.

Documentação detalhada: `docs/CI_SECRETS.md`.

## Fluxo CI/CD
1) `push` ou `pull_request` para `main`:
   - Verifica Figma (`scripts/figma_check.sh`) e sincroniza tokens (`scripts/figma-tokens-sync.js`).
   - Gera CSS opcional (`scripts/token-to-css.js`).
   - Publica artifacts (tokens/exports) para inspeção.
2) `deploy` (condicional em `main`):
   - Baixa env do Vercel, build e deploy.
3) Disparo manual: `workflow_dispatch` (acionável via GitHub UI).
4) Agendado: `cron` noturno para reforçar consistência (tokens sempre atualizados).

## Desenvolvimento com Trae
- Abra a pasta do projeto no Trae. Certifique `.env.figmacheck` com:
```
FIGMA_TOKEN=<seu_token_figma>
FIGMA_FILE_KEY=UQwbW2cybw7SGzlBWHlgcr
```
- Scripts úteis (rodar no terminal integrado do Trae):
  - `bash scripts/figma_check.sh`
  - `node scripts/figma-tokens-sync.js`
  - `node scripts/token-to-css.js`
  - `bash scripts/setup-gh-secrets.sh .env.ci`

## Mapeamento Design → Código
Crie/atualize um arquivo `design-system/mapping.json` para relacionar nodes do Figma a componentes:
```json
{
  "button/primary": { "figmaNodeId": "1234:5678", "component": "src/components/ButtonPrimary.tsx" },
  "chip/success":   { "figmaNodeId": "2345:6789", "component": "src/components/ChipSuccess.tsx" }
}
```
- Benefícios: rastreabilidade, revisão focada, detecção de divergências.

## Política de Tokens
- Origem: `figma-tokens-sync.js` → `design-system/tokens.json`.
- Enriquecimento opcional: `scripts/enrich-tokens-min.js` → `design-system/export/`.
- Consumo:
  - Frontend: importar `tokens.json` e/ou `export/*`.
  - CSS: usar arquivo gerado por `token-to-css.js`.

## Checklist de Integração
- [ ] Preencher `.env.ci` com valores reais e executar `scripts/setup-gh-secrets.sh`.
- [ ] Confirmar `FIGMA_TOKEN` válido (Figma Personal Access Token).
- [ ] Rodar `figma_check.sh` e `figma-tokens-sync.js` localmente.
- [ ] Subir código (incluindo `package.json`) para habilitar build/deploy no CI.
- [ ] Validar artifacts do workflow e o deploy no Vercel.

## Troubleshooting
- `Operation timed out` local: ver permissões/IO; rodar novamente no terminal do Trae ou local fora da sandbox.
- Falta de `package.json` no CI: workflow está resiliente e pula etapas; após push do projeto completo, build/deploy voltam a rodar.
- SSH com GitHub: teste com `ssh -T git@github.com` ou use HTTPS no `origin`.

---
Este plano consolida o estado atual e os passos operacionais para manter Figma, GitHub e Trae sincronizados continuamente.
