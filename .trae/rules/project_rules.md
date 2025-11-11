Regulamento Operacional do Agente Trae (PAYHUB - P4YHU3)
I. Pilar de Segurança e Conformidade (Chaves e Compliance)
Objetivo: Proibir a exposição de segredos em código, logs ou front-end, garantindo o Compliance de Nível Bancário.
Categoria
Regra Expressa (Ação Proibida/Exigida)
Fundamento Técnico (PAYHUB/XRPL)
Chaves Secretas (XRPL_SEED, KMS)
É estritamente proibido incluir chaves confidenciais (XRPL_SEED, chaves KMS, JWT Secrets) em qualquer código-fonte, log de console ou banco de dados.
O Agente deve sempre instruir que a XRPL_SEED seja carregada APENAS via variável de ambiente (.env.local não versionado). A chave deve ser criptografada em repouso por um Key Management Service (KMS) e descriptografada efemeramente apenas no backend para assinar transações críticas (EscrowFinish).
Transações Críticas
Toda transação on-chain que requer a XRPL_SEED (como EscrowCreate ou EscrowFinish) deve ser executada exclusivamente no backend Node.js/Servidor.
O front-end (escrow-monitor.tsx) só pode enviar o owner e o offerSequence para o endpoint de API seguro (/api/escrow/finish/route.ts) no servidor, que detém a chave isolada.
Autenticação
Exigir o uso de tokens JWT (JSON Web Token) de curta duração para proteger todas as rotas de API críticas, como o endpoint EscrowFinish.
II. Pilar de Frameworks e Arquitetura (Stack Principal)
Objetivo: Reforçar o alinhamento com a arquitetura existente (Next.js/XRPL) para consistência e escalabilidade.
Categoria
Regra Expressa (Ação Proibida/Exigida)
Fundamento Técnico (PAYHUB/XRPL)
Stack Principal
Priorizar soluções utilizando Next.js 16+, Node.js e a biblioteca xrpl.js para interações on-chain.
A arquitetura do PAYHUB baseia-se no API GATEWAY (HUB), que utiliza rotas de API (ex: /api/escrow/finish/route.ts) para orquestrar a liquidação Escrow.
Terminologia Consistente
Manter a terminologia técnica do projeto: Escrow (custódia na XRPL), RLUSD (Issued Currency/Stablecoin simulada), KMS, ODL (Liquidez Sob Demanda), EVM Sidechain.
O Agente deve referenciar que o EscrowCreate para RLUSD deve usar o formato IOU (Issued Currency) com o campo issuer definido.
Ambiente de Execução
Priorizar comandos e soluções para o ambiente Node.js/Terminal (Linux/macOS).
III. Pilar de Padrões de Codificação e Robustez (Try-Catch)
Objetivo: Melhorar a robustez e a capacidade de manutenção, garantindo um código production-grade.
Categoria
Regra Expressa (Ação Proibida/Exigida)
Fundamento Técnico (PAYHUB/XRPL)
Linguagem e Convenção
Usar exclusivamente TypeScript para todo o código do backend. Exigir a convenção de nomenclatura camelCase para variáveis e funções.
A tipagem forte e a padronização são essenciais para a maturidade de engenharia.
Tratamento de Erros (Assíncrono)
Exigir que toda operação assíncrona (ex: interações XRPL, chamadas de API externa como OpenAI) seja envolvida por uma estrutura try-catch robusta.
Isso garante a Resiliência da Aplicação, permitindo que o sistema se recupere de forma limpa em vez de travar (ex: tratamento elegante do erro 429 Too Many Requests de APIs externas).
Funções Inseguras
Proibir o uso de funções inseguras ou que quebram a tipagem, como eval(), new Function().
IV. Pilar de Logs e Observabilidade (Auditoria)
Objetivo: Padronizar o tratamento de erros e prevenir a exposição de PII/segredos em logs.
Categoria
Regra Expressa (Ação Proibida/Exigida)
Fundamento Técnico (PAYHUB/XRPL)
Logs de Servidor
Proibir o uso direto de console.log() para logs de servidor. Exigir o uso de um repositório de log padronizado (ex: um logger unificado em lib/logger.ts).
O logging padronizado é crucial para a Auditoria e Rastreabilidade de Incidentes, especialmente para registrar os Hashes e Sequences de transações XRPL.
Logs de Erro
Os logs de erro devem ser detalhados, mas NUNCA registrar dados confidenciais (PII ou chaves secretas).
Logs detalhados (ex: LOG_GPT_ERROR) são essenciais para diagnóstico, mas devem manter a conformidade de segurança e privacidade.