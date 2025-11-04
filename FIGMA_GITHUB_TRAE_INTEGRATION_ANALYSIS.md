# Figma + GitHub + TRAE — Análise de Integração (PAYHUB_V3)

## Visão Geral
- Objetivo: alinhar design (Figma), desenvolvimento (TRAE/Code) e entrega (GitHub/CI/CD) para maximizar velocidade e qualidade.
- Estado atual: token do Figma configurado; importador local criado; docs de integração criadas; CI/CD ainda não configurado.

## Estado por Plataforma

**Figma**
- Token salvo: `figma-prototype/figma.config.json`
- Importador local: `scripts/figma-import.js`
- Gap: `fileKey` atual é de Slides/FigJam → API retorna 400 (somente Design Files são suportados)
- Ação: duplicar o Pitch para um “Figma Design File” e enviar novo `fileKey`.

**TRAE (IDE/Código)**
- Base de código pronta; docs de hackathon e segurança presentes.
- Importador sem dependências implementado (Node >=18).
- Gap: sem preview automatizado de deploy; integração de tokens de design ainda manual.

**GitHub/CI/CD**
- Gap: não há pipeline automatizado.
- Ação: criar workflow de build/test/deploy via Vercel; secrets no repositório.

## Plano em 3 Fases

**Fase 1 — CI/CD e Deploy (agora)**
- Adicionar workflow `deploy.yml` para:
  - checkout + Node 18
  - install condicionado a `package.json`
  - type-check condicionado a `tsconfig.json`
  - build condicionado a `npm run build`
  - deploy Vercel (secrets presentes)
- ROI: altíssimo (push → deploy em ~3min)
- Métricas: tempo total de pipeline; sucesso de build/deploy.

**Fase 2 — Design Tokens Sync**
- Extrair paleta e tipografia do Figma (via plugin/API) → CSS variables.
- Publicar em `design-system/` com versionamento.
- Métricas: nº de tokens sincronizados; tempo de integração; regressões visual.

**Fase 3 — Asset & Components Pipeline**
- Importação automática de SVG/PNG dos frames selecionados.
- Geração de componentes base (Button/Card/Input) com estilos do design system.
- Métricas: nº de assets; latência de import; cobertura de componentes.

## Métricas de Sucesso
- Deploy automático habilitado (PR preview + main)
- Tempo de pipeline ≤ 3 min
- Tokens de design versionados e aplicados
- Assets importados e organizados em `design-system/assets/`

## Requisitos
- Secrets GitHub: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Node 18+ no workflow
- Figma Design File `fileKey` alfanumérico com leitura pública ou acesso via token

---

Pronto para execução: Fase 1 será habilitada pelo workflow incluído neste commit.