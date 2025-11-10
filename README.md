# PAYHUB V3 — Executive README (EN)

<div align="center">

![GitHub Actions](https://img.shields.io/github/actions/workflow/status/DGuedz/payhub-v3/deploy.yml?label=CI/CD&logo=github-actions&logoColor=white&style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&style=for-the-badge)
![Figma](https://img.shields.io/badge/Figma-Design%20System-purple?logo=figma&style=for-the-badge)
![XRPL](https://img.shields.io/badge/XRPL-Blockchain-black?logo=xrp&style=for-the-badge)

</div>

> Nota (PT-BR): Este README é o documento executivo padrão exibido na página inicial do GitHub. A versão dedicada continua disponível em `README_EXECUTIVO_EN.md`. O índice completo está em `docs/INDEX.md`.

## Overview
- PAYHUB is a hybrid payments and liquidity infrastructure built on XRPL (XRP Ledger).
- Mission: eliminate D+60 settlement delays and abusive discount rates; enable D+0 settlement in 3–5s using RLUSD.
- Scope: frontend, backend, blockchain, security, integrations, CI/CD, and B2B demos.

## Why It Matters
- Merchants in LATAM lose 10–20% margin due to MDR/discount and D+30–D+60 settlement.
- PAYHUB converts receivables into immediate RLUSD liquidity, then optimizes treasury yield automatically.

## Core Capabilities
- On-Demand Liquidity (ODL): D+0 settlement via RLUSD on XRPL.
- Collateralized financing: tokenized receivables (RWA) used as DeFi collateral.
- Trustless Escrows: programmatic payments with `EscrowCreate` / `EscrowFinish` on XRPL.
- Yield Engine: idle RLUSD balances earn APY with controlled risk strategies.
- Wallets & Integrations: Xumm (XRPL), MetaMask (EVM sidechain), PIX/Card via API HUB.

## 🛠️ Technical Architecture

### Frontend Stack
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite&logoColor=white&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwind-css&logoColor=white&style=flat-square)

### Backend (Planned)
![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?logo=node.js&logoColor=white&style=flat-square)
![Express](https://img.shields.io/badge/Express-Framework-000000?logo=express&logoColor=white&style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-Edge%20Functions-3ECF8E?logo=supabase&logoColor=white&style=flat-square)

### Blockchain & XRPL
![XRPL](https://img.shields.io/badge/XRPL-Ledger-23292F?logo=xrp&logoColor=white&style=flat-square)
![RLUSD](https://img.shields.io/badge/RLUSD-Stablecoin-008C73?logo=ripple&logoColor=white&style=flat-square)
![AMM](https://img.shields.io/badge/AMM-Automated%20Market%20Maker-00AA00?style=flat-square)

### Integrations
![API HUB](https://img.shields.io/badge/API%20HUB-Unified%20Gateway-FF6B35?logo=postman&logoColor=white&style=flat-square)
![Webhooks](https://img.shields.io/badge/Webhooks-Real--time-6B46C1?logo=webhooks&logoColor=white&style=flat-square)

## Security & Compliance
- Active Defense (honeypot wallets), intrusion alerts, containment.
- KMS/HSM-ready key isolation, rotation, and strict access policies.
- Audit trails, observability, LGPD/GDPR-aligned data minimization.

## Demo Highlight (Crypto Point)
- Four-module demo: onboarding, RWA tokenization for D+0, treasury APY, NFT ticket + escrow-based atomic liquidation.
- Validated with XRPL ecosystem events and partners; enterprise-ready narrative.

## 📊 Project Status & Metrics

### 🎯 Performance KPIs
![TTFB](https://img.shields.io/badge/TTFB-180ms-green?logo=webpack&logoColor=white&style=flat-square)
![FCP](https://img.shields.io/badge/FCP-1.1s-yellow?logo=webpack&logoColor=white&style=flat-square)
![LCP](https://img.shields.io/badge/LCP-1.4s-orange?logo=webpack&logoColor=white&style=flat-square)
![CLS](https://img.shields.io/badge/CLS-0.03-green?logo=webpack&logoColor=white&style=flat-square)

### ⚡ Backend Targets
![Response Time](https://img.shields.io/badge/Response%20Time-<50ms-brightgreen?logo=node.js&logoColor=white&style=flat-square)
![Idempotency](https://img.shields.io/badge/Idempotency-Robust-00B0F0?logo=check-circle&logoColor=white&style=flat-square)

### ⛓️ Blockchain Performance
![Settlement Time](https://img.shields.io/badge/Settlement-3–5s-008C73?logo=xrp&logoColor=white&style=flat-square)
![Transaction Cost](https://img.shields.io/badge/Cost-~R$%200,0001-00AA00?logo=currency-exchange&logoColor=white&style=flat-square)

## 🚀 Getting Started

### Quick Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Badges
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white&style=flat-square)
![npm](https://img.shields.io/badge/npm-10+-CB3837?logo=npm&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white&style=flat-square)

### 📚 Documentation
[![Documentation Index](https://img.shields.io/badge/INDEX-Full%20Documentation-0088CC?logo=read-the-docs&logoColor=white&style=for-the-badge)](docs/INDEX.md)
[![Technical Report](https://img.shields.io/badge/Technical%20Report-Detailed%20Analysis-6B46C1?logo=bookstack&logoColor=white&style=for-the-badge)](docs/RELATORIO_TECNICO_COMPLETO.md)
[![Executive Summary](https://img.shields.io/badge/Executive%20Summary-Business%20Overview-FF6B35?logo=google-docs&logoColor=white&style=for-the-badge)](README_EXECUTIVO_EN.md)
[![XRPL Demo (PT)](https://img.shields.io/badge/XRPL-Demo%20Completa%20(PT)-23292F?logo=xrp&logoColor=white&style=for-the-badge)](docs/SIMULACAO_COMPLETA_DEVNET.md)
[![Devnet Artifacts (PT)](https://img.shields.io/badge/Devnet-Artefatos%20de%20Execu%C3%A7%C3%A3o%20(PT)-008C73?logo=data&logoColor=white&style=for-the-badge)](docs/DEMO_ARTIFACTS_DEVNET.md)

## 🔗 References & Ecosystem

### XRPL Documentation
[![XRPL Docs](https://img.shields.io/badge/XRPL-Official%20Documentation-23292F?logo=xrp&logoColor=white&style=for-the-badge)](https://xrpl.org/)
[![AMM Overview](https://img.shields.io/badge/AMM-Automated%20Market%20Maker-00AA00?logo=book&logoColor=white&style=for-the-badge)](https://xrpl.org/amm-overview.html)
[![Issued Currencies](https://img.shields.io/badge/IOUs-Issued%20Currencies-008C73?logo=currency-exchange&logoColor=white&style=for-the-badge)](https://xrpl.org/issued-currencies-overview.html)

### Ripple & RLUSD
[![Ripple](https://img.shields.io/badge/Ripple-Enterprise%20Solutions-008C73?logo=ripple&logoColor=white&style=for-the-badge)](https://ripple.com/)
[![RLUSD Vision](https://img.shields.io/badge/RLUSD-Stablecoin%20Vision-008C73?logo=bank&logoColor=white&style=for-the-badge)](https://ripple.com/)

### Development Tools
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github&logoColor=white&style=for-the-badge)](https://github.com/DGuedz/payhub-v3)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?logo=vercel&logoColor=white&style=for-the-badge)](https://vercel.com/)
[![Figma](https://img.shields.io/badge/Figma-Design-FF7262?logo=figma&logoColor=white&style=for-the-badge)](https://figma.com/)

## 📞 Contact & Submission

### 📋 Documentation Navigation
[![Documentation Index](https://img.shields.io/badge/📚-Full%20Documentation%20Index-0088CC?logo=read-the-docs&logoColor=white&style=for-the-badge)](docs/INDEX.md)
[![Export PDF](https://img.shields.io/badge/📄-Export%20PDF%20for%20Review-FF6B35?logo=adobe-acrobat-reader&logoColor=white&style=for-the-badge)](docs/INDEX.md)

### 🎯 Hackathon Submission
![XRPL Vega House](https://img.shields.io/badge/XRPL-Vega%20House%20Hackathon-23292F?logo=xrp&logoColor=white&style=for-the-badge)
![Hybrid Payments](https://img.shields.io/badge/Hybrid-Payments%20Platform-008C73?logo=cash-app&logoColor=white&style=for-the-badge)

### 📊 Live Demos & Preview
[![Vercel Preview](https://img.shields.io/badge/🚀-Live%20Demo%20Preview-000000?logo=vercel&logoColor=white&style=for-the-badge)](https://vercel.com/)
[![Figma Prototype](https://img.shields.io/badge/🎨-Figma%20Design%20System-FF7262?logo=figma&logoColor=white&style=for-the-badge)](https://figma.com/)
