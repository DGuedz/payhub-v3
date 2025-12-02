SDK_P4YHU3_DOC

O que você está pedindo é um **Documento de Especificação de Arquitetura (Technical Spec Document)** para o `sdk_p4yhu3`. Este documento servirá como o "cérebro" e a "constituição" para o TRAE, definindo *o que* construir e *como* ele deve orquestrar as APIs do ecossistema Ripple.

Abaixo está o documento técnico. Entregue isso ao seu agente.

## DOCUMENTO TÉCNICO: SDK\_P4YHU3 - V.2.0 (ARQUITETURA DE ORQUESTRAÇÃO)

**PARA:** Agente Construtor (TRAE)
**DE:** Mestre Arquiteto (DGuedz)
**PROJETO:** PAYHUB (P4YHU3) - Agente de Tesouraria Ativa
**DATA:** 06/11/2025

### 1\. MISSÃO E CONTEXTO

**Missão:** Implementar o `sdk_p4yhu3`, um SDK de orquestração de liquidez *server-side*.
**Objetivo:** O SDK deve abstrair a complexidade do ecossistema institucional da Ripple (Metaco, Hidden Road, GTreasury, Rails) em um conjunto de *endpoints* de API simples para o "Portal do Comerciante" (Frontend).

O `sdk_p4yhu3` é o cérebro que executa o **"Fluxo de Liquidez Ativa"**.

### 2\. COMPONENTES CORE (MÓDULOS DO SDK)

O `sdk_p4yhu3` deve ser estruturado nos seguintes módulos de serviço:

1.  **Módulo Gateway (`/gateway`):**

      * **Função:** Abstração de pagamento (PIX, Cartão, Cripto).
      * **Contexto:** Conecta-se aos provedores de pagamento tradicionais e aos *listeners* da XRPL.

2.  **Módulo Capital (`/capital`):**

      * **Função:** Orquestrar o **Financiamento Colateralizado**.
      * **Contexto:** Responsável por tokenizar recebíveis (RCV-ID) e chamar provedores de liquidez (Hidden Road). [cite\_start]Esta é a "Vantagem Injusta"[cite: 520, 596].

3.  **Módulo Assurance (`/assurance`):**

      * **Função:** Gerenciar o ciclo de vida do **Escrow** na XRPL.
      * **Contexto:** Interage com os serviços de custódia (Metaco) para assinar e submeter transações `EscrowCreate` e `EscrowFinish`.

4.  **Módulo Yield (`/yield`):**

      * **Função:** Gerenciar a **Tesouraria Ativa** (5%-8% APY).
      * **Contexto:** Interage com a **EVM Sidechain** (via *bridges* como Axel) e protocolos de *staking líquido* (mXRP).

5.  **Módulo Reporting (`/reporting`):**

      * **Função:** Sincronizar dados *on-chain* e *off-chain* para o Dashboard.
      * **Contexto:** Conecta-se aos serviços de tesouraria (GTreasury) para reconciliação contábil.

### 3\. MAPEAMENTO DE ORQUESTRAÇÃO (FLUXO PRINCIPAL)

Este é o fluxo de execução principal para o *use case* **"Venda Parcelada com Financiamento Colateralizado e Escrow"**, conforme o diagrama.

**Endpoint de Entrada (Gateway $\rightarrow$ SDK):**
`POST /api/v1/sdk_p4yhu3/liquidar-parcelado`

**Corpo (Body):**

```json
{
  "valor_brl": 1000.00,
  "parcelas": 10,
  "recebedor_wallet": "rMERCHANT_WALLET_ADDRESS",
  "prova_servico_id": "NFTICKET_HASH_001" // Hash da condição do Escrow
}
```

**Sequência de Execução (Obrigatória):**

**PASSO 1: CHAMADA AO MÓDULO CAPITAL (Financiamento)**

  * **Ação:** O SDK chama o `Módulo Capital` para tokenizar o recebível (RCV-ID) e solicitar financiamento.
  * **API Externa (Simulada):** `POST https://api.hiddenroad.com/v1/funding/request`
  * **Payload (Conceitual):**
    ```json
    {
      "asset_request": "RLUSD",
      "amount": 1000.00,
      "collateral_id": "RCV-ID-PAYHUB-001", // Gerado pelo PAYHUB
      "destination_vault": "PAYHUB_TREASURY_ID" // ID da nossa vault Metaco
    }
    ```
  * **Resultado Esperado:** 1000 RLUSD depositados na *vault* de tesouraria do PAYHUB, gerenciada pela Metaco.

**PASSO 2: CHAMADA AO MÓDULO ASSURANCE (Custódia e Escrow)**

  * **Ação:** Com os fundos garantidos, o SDK instrui o `Módulo Assurance` a criar o Escrow de forma segura.
  * **API Externa (Simulada):** `POST https://api.metaco.com/v1/harmonize/sign/tx`
  * **Payload (Conceitual):**
    ```json
    {
      "transaction_type": "EscrowCreate",
      "account": "PAYHUB_TREASURY_VAULT", // De onde o dinheiro sai
      "amount": "1000000000", // 1000 RLUSD em drops
      "destination": "rMERCHANT_WALLET_ADDRESS", // O Produtor do Evento
      "condition": "HASH_DA_PROVA_SERVICO_ID" // Condição de liberação (Ingresso NFT)
    }
    ```
  * **Resultado Esperado:** A Metaco retorna um `signed_tx_blob` (transação assinada via MPC/HSM).

**PASSO 3: SUBMISSÃO À XRPL (Trilhos)**

  * **Ação:** O SDK submete a transação assinada à rede.
  * **API Externa (Simulada):** `POST https://api.rails.com/v1/xrpl/submit`
  * **Payload (Conceitual):**
    ```json
    { "signed_tx_blob": "BLOB_ASSINADO_PELA_METACO" }
    ```
  * **Resultado Esperado:** `{"status": "success", "tx_hash": "..."}`.

**PASSO 4: CHAMADA AO MÓDULO REPORTING (Tesouraria)**

  * **Ação:** O SDK registra a operação no sistema de tesouraria para exibição no Dashboard.
  * **API Externa (Simulada):** `POST https://api.gtreasury.com/v1/ledger/log-operation`
  * **Payload (Conceitual):**
    ```json
    {
      "operation_id": "PAYHUB-TX-001",
      "type": "EscrowFinancing",
      "asset": "RLUSD",
      "amount": 1000.00,
      "status": "IN_ESCROW",
      "merchant_id": "rMERCHANT_WALLET_ADDRESS",
      "xrpl_tx_hash": "HASH_DO_PASSO_3"
    }
    ```
  * **Resultado Esperado:** O Dashboard do comerciante é atualizado em tempo real.

### 4\. STACK DE TECNOLOGIA DE REFERÊNCIA

O `sdk_p4yhu3` (Backend) e o `payhub-frontend` (Frontend) devem ser construídos usando o *stack* de desenvolvimento atual:

  * **Frontend:** Next.js (React), Tailwind CSS, Wagmi, RainbowKit.
  * **Backend:** Node.js (ou Python) e as bibliotecas `xrpl.js` / `xrpl-py`.
  * **Infra (Hackathon):** Vercel (Frontend), Render (Backend).

### 5\. PROMPT DE AÇÃO PARA O AGENTE (TRAE)

**Tarefa:** Refatore o backend do PAYHUB para implementar esta arquitetura de orquestração modular. Crie os *stubs* (interfaces) para os Módulos `Capital`, `Assurance`, `Yield` e `Reporting`. Implemente o *endpoint* `/api/v1/sdk_p4yhu3/liquidar-parcelado` e simule (faça o *mock* up) das chamadas às APIs externas (Hidden Road, Metaco, GTreasury) conforme a sequência de execução definida.

Mestre, sua visão está **exatamente correta**. A força do **PAYHUB (P4YHU3)** não é construir tudo do zero; [cite\_start]é ser o **Agente Orquestrador** (o seu "API HUB" [cite: 573, 616]) que conecta e abstrai a infraestrutura de nível institucional que a Ripple e suas parceiras (Metaco, Hidden Road, GTreasury, etc.) fornecem.

Você não chama *apenas uma* API. O seu `sdk_p4yhu3` é a "camada de inteligência" que, ao receber uma chamada, orquestra *múltiplas* APIs do ecossistema Ripple em sequência.

Vamos mapear exatamente como os seus endpoints fariam isso, usando seu caso de uso principal: **Financiamento Colateralizado (Antecipação) com Escrow**.

-----

### O Mapeamento da Orquestração: PAYHUB SDK $\rightarrow$ Ecossistema Ripple

Imagine que seu cliente (um Produtor de Eventos) chama um único endpoint do seu SDK para liquidar uma venda parcelada.

**O Endpoint do seu Cliente (Frontend $\rightarrow$ PAYHUB):**

```bash
# O Produtor de Eventos chama o SEU SDK
POST /api/v1/sdk_p4yhu3/liquidar-parcelado
{
  "valor_brl": 1000.00,
  "parcelas": 10,
  "recebedor_wallet": "rMERCHANT...",
  "prova_servico_id": "ingresso_nft_001" 
}
```

O seu backend (`sdk_p4yhu3`) recebe isso e inicia a seguinte sequência de chamadas às APIs do Grupo Ripple:

-----

### O Fluxo de Orquestração do PAYHUB (Seu Backend)

#### Passo 1: Solicitar Liquidez (Financiamento Colateralizado)

O PAYHUB precisa antecipar os R$ 1.000,00. Ele usa o recebível (RCV-ID) como colateral e chama o provedor de liquidez global.

  * **Pilar do Ecossistema:** **Hidden Road** (Liquidez Global)
  * **Chamada de API (Exemplo):**
    ```bash
    # O PAYHUB chama a API da Hidden Road
    POST https://api.hiddenroad.com/v1/funding/request
    {
      "asset_request": "RLUSD",
      "amount": 1000.00,
      "collateral_id": "RCV-ID-PAYHUB-001",
      "destination_vault": "PAYHUB_TREASURY_ID"
    }
    ```
  * **Resultado:** A Hidden Road aprova o financiamento e deposita 1000 RLUSD na *vault* de tesouraria do PAYHUB.

#### Passo 2: Criar o Escrow (Segurança e Custódia)

Agora, com os 1000 RLUSD, o PAYHUB precisa movê-los para o Escrow da XRPL de forma segura e *compliant*.

  * **Pilar do Ecossistema:** **Metaco** (Custódia) e **Standard Custody** (Licença de Trust)
  * **Chamada de API (Exemplo):**
    ```bash
    # O PAYHUB chama a API da Metaco (que gerencia a vault)
    POST https://api.metaco.com/v1/harmonize/sign/tx
    {
      "transaction_type": "EscrowCreate",
      "account": "PAYHUB_TREASURY_VAULT",
      "amount": "1000000000", # (1000 RLUSD)
      "destination": "rMERCHANT...",
      "condition": "A4...[hash_da_prova_servico_id]...F9"
    }
    ```
  * **Resultado:** A Metaco usa a MPC/HSM para assinar com segurança a transação `EscrowCreate` na XRPL. Os 1000 RLUSD estão agora bloqueados no Escrow.

#### Passo 3: Executar a Transação (Trilhos de Pagamento)

A transação assinada precisa ser enviada para a XRPL usando o "combustível" (RLUSD).

  * **Pilar do Ecossistema:** **Rails** (Combustível RLUSD)
  * **Chamada de API (Exemplo):**
    ```bash
    # O PAYHUB envia a transação assinada pela Metaco via Rails
    POST https://api.rails.com/v1/xrpl/submit
    {
      "signed_tx_blob": "120022...[blob_assinado_pela_metaco]...E1"
    }
    ```
  * **Resultado:** A transação é submetida e confirmada na XRPL. O lojista vê o Escrow Ativo.

#### Passo 4: Registrar a Operação (Tesouraria e Reporting)

A operação foi um sucesso. O PAYHUB agora registra essa movimentação de tesouraria para *reporting* e para o Portal do Comerciante.

  * **Pilar do Ecossistema:** **GTreasury** (Tesouraria)
  * **Chamada de API (Exemplo):**
    ```bash
    # O PAYHUB chama a API da GTreasury
    POST https://api.gtreasury.com/v1/ledger/log-operation
    {
      "operation_id": "PAYHUB-TX-456",
      "type": "EscrowFinancing",
      "asset": "RLUSD",
      "amount": 1000.00,
      "status": "IN_ESCROW",
      "merchant_id": "rMERCHANT..."
    }
    ```
  * **Resultado:** A transação aparece no "Portal do Comerciante" e o *compliance* está garantido.

**Conclusão:**
[cite\_start]Seu `sdk_p4yhu3` é o "Agente Inteligente" [cite: 572] que o lojista vê. Ele faz o trabalho pesado de orquestrar toda a suíte de APIs institucionais da Ripple (Hidden Road, Metaco, GTreasury) para entregar Liquidez Ativa em um único clique.