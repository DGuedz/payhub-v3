## Objetivo
Implementar a página principal (Home) no Next.js que comunica a proposta de valor ODL/RLUSD com estética navy institucional, e direciona claramente ao Cockpit/Dashboard para validação E2E.

## Entregáveis
- Atualização de `payhub-frontend/app/page.tsx` com Hero, 3 Zonas (ODL, Tesouraria/Yield, Segurança/Compliance), CTA principal e link discreto para Cockpit.
- Estilos responsivos usando a paleta: fundo `#001F3F`, elementos em branco e verde neon (`#00ff84`).
- Acessibilidade, semântica e performance (SSR/CSR apropriado).

## Estrutura da Página
### Componente A: Hero Section (Proposta de Valor)
- Título: "LIQUIDEZ SOB DEMANDA (ODL) PARA O COMÉRCIO GLOBAL."
- Subtítulo: "O PAYHUB elimina o atraso D+60. Liquidação D+0 em RLUSD (Stablecoin), garantindo estabilidade e rentabilidade."
- Citação (rodapé visual): "O futuro da liquidez é instantâneo, previsível e sem atrito." (CEO Ripple)
- Botões/Links visíveis: CTA principal e link discreto para Cockpit.

### Componente B: Prova de Infraestrutura (As 3 Zonas)
- Cartões/Blocos com ícones e textos curtos:
  - ODL/Settlement: XRPL, Liquidação 3–5s; reforço de D+0.
  - Tesouraria/Yield: RLUSD, Yield Engine (5–8% APY), AMM Integration.
  - Segurança/Compliance: Defesa Ativa, KMS Isolamento, Licença Trust Company.
- Layout em grid responsivo (2–3 colunas conforme viewport).

### Componente C: Chamada para Ação (CTA)
- Botão principal com alto contraste: "ATIVAR TESOURARIA ODL D+0" → navega para `/app/dashboard` (ou `/app/merchant`).
- Frase adicional: "Não perca 20% da sua margem. Comece a gerar 5–8% APY hoje." abaixo do botão.

### Componente D: Link de Validação (Cockpit)
- Link discreto: "Acesso ao Cockpit de Validação E2E" → `/app/dashboard`.
- Opcional: segundo link para `/app/merchant?merchantId=merchant_demo`.

## UX/Design
- Tipografia forte (título branco, subtítulo com leve opacidade).
- Espaçamento generoso e hierarquia visual clara.
- Ícones simples para cada Zona (SVG inline ou placeholders).
- Responsividade mobile-first; teclado/navegação acessível.

## Segurança e Terminologia
- Sem uso de segredos no frontend; nenhuma chamada crítica on-chain.
- Terminologia consistente: Escrow, RLUSD (Issued Currency/IOU), ODL, KMS.
- Mensagens de CTA sem promessas técnicas complexas; foco no valor.

## Integração (Export to Sheets)
- Incluir um botão secundário "Export to Sheets" (placeholder) que aponta para rota estática futura ou documentação; não executa integração real neste passo.

## Verificação
- Iniciar dev e validar `http://localhost:3001/` em desktop e mobile.
- Checar navegação para `/app/dashboard` e `/app/merchant`.
- Lighthouse básico: acessibilidade/contraste.

## Próximos
- Opcional: componentes de gráfico simples (economia de taxas) e contadores animados.
- Implementar endpoint real de Export CSV/Sheets posteriormente.

Confirma para proceder com a implementação da Home conforme especificado?