# Privacidade no PIX via PAYHUB e XRPL

O PAYHUB (P4YHU3) estabelece a "Privacidade em Primeiro Lugar" como prioridade, garantindo que a eficiência do PIX não comprometa a segurança dos dados pessoais e financeiros, alicerçado na infraestrutura trustless da XRP Ledger (XRPL).

## 1. O Desafio do PIX: Perda de Privacidade
O PIX, ao digitalizar transações que antes eram em espécie, resulta em perda de privacidade sobre o fluxo de dinheiro. Embora seja eficiente, ele vincula o ID da transação a dados pessoais (CPF/CNPJ) e facilita o cruzamento via e-financeira. O PAYHUB atua como Firewall de Privacidade na liquidação on-chain.

## 2. Fluxo Híbrido e Abstração de Dados
| Fase | Ação no PAYHUB | Ganho de Privacidade |
|---|---|---|
| 1. Entrada Fiat (On-Ramp) | Cliente paga via PIX em BRL para conta intermediária licenciada | Privacidade Fiscal: o *e-financeira* registra o intermediário local; o nome do PAYHUB (offshore) não aparece |
| 2. Conversão e Escrow | BRL → RLUSD; inicia contrato `EscrowCreate` | Estabilidade e previsibilidade de liquidação (RLUSD) |
| 3. Mecanismo Crítico | Geração de Carteira XRPL Efêmera por transação | Dissociação: a carteira temporária é o `From:` do EscrowCreate; o ID XRPL não é vinculado ao pagador PIX |
| 4. Liquidação Atômica | `EscrowFinish` libera RLUSD ao comerciante (3–5s) | Anonimato on-chain: a carteira efêmera é descartada, preservando a privacidade |

## 3. Carteira Efêmera (Componente Crítico)
- Carteira XRPL gerada just-in-time para a transação
- Impede ligação direta entre dados KYC/PIX e endereço público on-chain
- Atua como firewall criptográfico, restaurando privacidade perdida pelo PIX tradicional

## 4. Compliance (Conformidade Abstraída)
- KYC/AML: comerciantes verificados, carteiras marcadas
- Reporting GTreasury: relatórios para tesouraria corporativa e reconciliação
- Compliance CSV: exporta logs XRPL (Escrow/Yield/Liquidação) sem exposição de PII

## Segurança Operacional
- `XRPL_SEED` carregada apenas via variável de ambiente/KMS; assinatura exclusiva no backend
- JWT curto nas rotas críticas; auditoria padronizada (`txHash`/`sequence`), sem PII

## Estratégia
- O PAYHUB dissocia dados fiduciários (PIX) da liquidação XRPL (RLUSD) com carteira efêmera, garantindo privacidade e segurança, enquanto mantém conformidade institucional.
