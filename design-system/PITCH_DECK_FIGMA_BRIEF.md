#  PITCH DECK – Brief UI/UX (PAYHUB)

## Paleta e Tipografia

### Paleta (HEX)
- Primário (Azul confiança): `#2563EB`
- Primário Hover: `#1D4ED8`
- Sucesso (Verde financeiro): `#10B981`
- XRPL Destaque (Laranja): `#F59E0B`
- Texto: `#1F2937`
- Neutros: `#F3F4F6`, `#E5E7EB`, `#111827`

### Tipografia
- Heading: Inter (600)
- Corpo: Inter (400/500)
- Técnico/Código: JetBrains Mono

---

## Elementos Visuais
- Logo PAYHUB (flat + versão dark)
- Ícones de segurança (escudo, cadeado, verificado)
- Moedas 3D (XRP, RLUSD)
- Globo digital (linhas de liquidez)
- Cartões de transação XRPL
- Badges (KMS/HSM, Honeypot, MFA)

---

## Estrutura – 12 Slides

1) Capa – PAYHUB_V3: IA + XRPL + Segurança
2) Problema – Pagamentos caros e lentos
3) Solução – Soft POS + ODL + RLUSD
4) Arquitetura – Fluxo XRPL + Hooks/EVM Sidechain
5) Segurança – Honeypot + KMS/HSM + MFA
6) Resiliência – Tratamento de 429/DDoS
7) UX – Checkout institucional (buttons, cards, inputs)
8) Performance – Settlement 3–5s, métricas
9) Custos – <1% vs 2–4% tradicionais
10) Mercado – Empresas, bancos, fintechs
11) Roadmap – MVP → Produção
12) Encerramento – Call to Action (Demo)

---

## Sugestões de Animações
- Microinterações (200ms) em botões e inputs
- Transições suaves entre slides (fade/slide)
- Skeleton loading para transações XRPL
- Linhas animadas no globo (ODL)
- Badges pulsantes para eventos de segurança

---

## Componentes UI (Referência)
- Botões: Primário, Secundário, Danger
- Cards: Transação, Saldo, Segurança
- Inputs: Valores, Endereço/Tag, Observações
- Modais: Confirmação, Erro, Sucesso
- Navegação: Header, Sidebar, Footer

---

## Checklist de Entrega
- [ ] Paleta e styles configurados no Figma
- [ ] Componentes com Auto Layout
- [ ] Ícones exportáveis (SVG)
- [ ] Slides montados com narrativa clara
- [ ] Animações sutis e consistentes
- [ ] Export pronto para integração no Trae IDE