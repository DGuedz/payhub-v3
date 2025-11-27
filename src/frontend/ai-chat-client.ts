/**
 * Cliente minimalista para PAYHUB_V3 AI Chat
 * Uso rápido para hackathon e demos
 */

const PROJECT_REF = "nsdujmcxbifhssipszdp";
const RES_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/ai-chat`;

/**
 * Envia mensagem para AI Chat (com ou sem autenticação)
 * @param message Mensagem do usuário
 * @param jwt Token JWT opcional (sem token = modo sandbox)
 * @returns Resposta da IA
 */
export async function sendMessage(message: string, jwt?: string) {
  const res = await fetch(RES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Helper de sandbox para demonstrações (sem token)
 * @param message Mensagem opcional para teste
 * @returns Resposta do modo sandbox
 */
export async function testSandbox(message = "hello sandbox") {
  return sendMessage(message, ""); // sem JWT = modo sandbox
}

/**
 * Teste rápido para validar integração
 */
export async function quickTest() {
  console.log(" Testando PAYHUB_V3 AI Chat...");
  
  try {
    const response = await testSandbox("Teste rápido PAYHUB");
    console.log(" Sandbox OK:", response);
    return response;
  } catch (error) {
    console.error(" Erro:", error);
    throw error;
  }
}