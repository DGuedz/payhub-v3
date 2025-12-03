/**
 * Demo completo do PAYHUB_V3 AI Chat
 * Exemplos prontos para hackathon XRPL Vega House
 */

import { sendMessage, testSandbox } from './ai-chat-client';

// ===== DADOS DA CONFIGURAÇÃO =====
const PROJECT_REF = "nsdujmcxbifhssipszdp";
const ENDPOINT = `https://${PROJECT_REF}.supabase.co/functions/v1/ai-chat`;

// ===== EXEMPLOS DE USO =====

/**
 * Demo 1: Sandbox (sem autenticação) - Ideal para demonstrações
 */
export async function demoSandbox() {
  console.log(" Demo 1: Modo Sandbox (sem custos)");
  
  try {
    const response = await testSandbox("Olá PAYHUB_V3! Como posso integrar XRPL?");
    console.log(" Resposta Sandbox:", response);
    return response;
  } catch (error: unknown) {
    console.error(" Erro Sandbox:", error);
    throw error;
  }
}

/**
 * Demo 2: Com autenticação JWT (quando houver quota OpenAI)
 */
export async function demoWithAuth() {
  console.log(" Demo 2: Com autenticação JWT");
  
  // Substitua pelo token real do seu usuário autenticado
  const userJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZHVqbWN4YmlmaHNzaXBzemRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDMzODUsImV4cCI6MjA3NzY3OTM4NX0.KwckQ53El1bHj2OA0yEb30s1_aQBgPKTmFfacWJbdv8";
  
  try {
    const response = await sendMessage("Explique como integrar XRPL no PAYHUB_V3", userJWT);
    console.log(" Resposta com Auth:", response);
    return response;
  } catch (error: unknown) {
    console.error(" Erro com Auth:", error);
    throw error;
  }
}

/**
 * Demo 3: Teste rápido para validar integração
 */
export async function quickValidationTest() {
  console.log(" Demo 3: Teste de Validação Rápida");
  
  const testMessages = [
    "Hello PAYHUB_V3!",
    "Como funciona o pagamento com XRPL?",
    "Teste de integração para hackathon"
  ];
  
  for (const msg of testMessages) {
    try {
      const response = await testSandbox(msg);
      console.log(` "${msg}" -> ${response.reply}`);
    } catch (error) {
      console.error(` Falha em "${msg}":`, error.message);
    }
  }
}

/**
 * Demo completa - Executa todas as validações
 */
export async function runFullDemo() {
  console.log(" Iniciando Demo Completa PAYHUB_V3 AI Chat");
  console.log("=" .repeat(50));
  
  try {
    // 1. Teste rápido de validação
    await quickValidationTest();
    
    console.log("\n" + "=" .repeat(50) + "\n");
    
    // 2. Demo principal sandbox
    await demoSandbox();
    
    console.log("\n" + "=" .repeat(50) + "\n");
    
    // 3. Demo com autenticação (opcional)
    console.log(" Demo com autenticação (requer quota OpenAI)");
    console.log(" Descomente a linha abaixo quando tiver quota ativa");
    // await demoWithAuth();
    
    console.log("\n Demo completa finalizada!");
    console.log(" Sistema pronto para hackathon XRPL Vega House!");
    
  } catch (error: unknown) {
    console.error(" Erro na demo:", error);
  }
}

// ===== TESTES VIA CURL =====

/**
 * Comandos curl para teste manual
 */
export const curlCommands = {
  sandbox: `curl -s -X POST "${ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"demo sandbox PAYHUB"}'`,
  
  withAuth: `curl -s -X POST "${ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <SEU_TOKEN_JWT>" \\
  -d '{"message":"demo com autenticação"}'`,
  
  quickTest: `curl -s -X POST "${ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"teste rápido"}' | jq .`
};

// ===== INSTRUÇÕES PARA HACKATHON =====

/**
 * Instruções rápidas para demonstração
 */
export const hackathonInstructions = `
 PAYHUB_V3 AI Chat - Instruções para Demo

1. MODO SANDBOX (Sem custos - Ideal para demos)
   - Use: testSandbox("sua mensagem")
   - Ou: sendMessage("sua mensagem") // sem JWT
   - Resposta local, sem custos OpenAI

2. MODO GPT (Com quota ativa)
   - Use: sendMessage("sua mensagem", userJWT)
   - Requer: Token JWT válido do usuário autenticado
   - Integração real com OpenAI GPT-4o-mini

3. ENDPOINT: ${ENDPOINT}
   - Project Ref: ${PROJECT_REF}
   - Função: ai-chat (Edge Function)

4. TESTE RÁPIDO:
   ${curlCommands.sandbox}

 Sistema pronto para demonstrações!
`;

// Exporta tudo para uso fácil
export { sendMessage, testSandbox } from './ai-chat-client';