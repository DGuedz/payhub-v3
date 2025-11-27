/**
 * Teste rápido do PAYHUB_V3 AI Chat
 * Execute: node test-ai-chat.js
 */

// Importa as funções (simulação para Node.js)
// Em produção, use o cliente Supabase oficial

const FUNCTION_URL = 'https://nsdujmcxbifhssipszdp.supabase.co/functions/v1/ai-chat';

/**
 * Cliente simplificado para teste
 */
async function sendMessage(message, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao chamar ai-chat:', error);
    throw error;
  }
}

/**
 * Testa o modo sandbox (sem token)
 */
async function testSandbox() {
  console.log(' Testando modo Sandbox...');
  try {
    const response = await sendMessage('Olá, PAYHUB_V3! Teste sandbox');
    console.log(' Resposta Sandbox:', response);
    return response;
  } catch (error) {
    console.error(' Erro Sandbox:', error.message);
    return null;
  }
}

/**
 * Testa com token JWT (modo GPT)
 */
async function testGPT() {
  console.log(' Testando modo GPT...');
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZHVqbWN4YmlmaHNzaXBzemRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDMzODUsImV4cCI6MjA3NzY3OTM4NX0.KwckQ53El1bHj2OA0yEb30s1_aQBgPKTmFfacWJbdv8';
  
  try {
    const response = await sendMessage('Como posso integrar XRPL no PAYHUB?', token);
    console.log(' Resposta GPT:', response);
    return response;
  } catch (error) {
    console.error(' Erro GPT:', error.message);
    return null;
  }
}

/**
 * Executa todos os testes
 */
async function runTests() {
  console.log(' Iniciando testes do PAYHUB_V3 AI Chat...\n');
  
  // Teste 1: Sandbox
  const sandboxResult = await testSandbox();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 2: GPT
  const gptResult = await testGPT();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Resumo
  console.log(' Resumo dos Testes:');
  console.log(`Sandbox: ${sandboxResult ? ' SUCESSO' : ' FALHOU'}`);
  console.log(`GPT: ${gptResult ? ' SUCESSO' : ' FALHOU'}`);
  
  if (sandboxResult && sandboxResult.mode === 'sandbox') {
    console.log('\n Modo Sandbox está funcionando!');
    console.log('A função está pronta para demonstrações sem custos OpenAI.');
  }
  
  if (gptResult && gptResult.reply) {
    console.log('\n Modo GPT está funcionando!');
    console.log('A integração com OpenAI está ativa.');
  }
}

// Executa os testes se este arquivo for executado diretamente
if (typeof window === 'undefined') {
  // Node.js environment
  console.log('️  Este teste requer fetch global. Execute em ambiente com fetch ou use node-fetch.');
  console.log(' Dica: Use o navegador ou um ambiente com fetch nativo.');
} else {
  // Browser environment
  runTests().catch(console.error);
}

// Exporta para uso em outros lugares
export { sendMessage, testSandbox, testGPT, runTests };