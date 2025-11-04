/**
 * Cliente helper para integração com a Edge Function ai-chat do PAYHUB_V3
 * 
 * Uso:
 * ```ts
 * import { sendMessage } from './ai-chat-client';
 * 
 * // Com token JWT (usuário autenticado)
 * const response = await sendMessage("Olá, PAYHUB!", userAccessToken);
 * console.log(response.reply); // Resposta da IA
 * 
 * // Modo sandbox (sem token)
 * const sandboxResponse = await sendMessage("Teste sandbox");
 * console.log(sandboxResponse.reply); // Resposta local
 * ```
 */

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  ok: boolean;
  mode?: 'sandbox' | 'gpt';
  reply?: string;
  error?: string;
}

const PROJECT_REF = 'nsdujmcxbifhssipszdp';
const FUNCTION_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/ai-chat`;

/**
 * Envia mensagem para a Edge Function ai-chat
 * @param message Mensagem do usuário
 * @param token JWT opcional (para modo GPT real)
 * @returns Promise com resposta da IA
 */
export async function sendMessage(
  message: string,
  token?: string
): Promise<ChatResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Adiciona autorização apenas se token fornecido
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message } as ChatRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json() as ChatResponse;
  } catch (error) {
    console.error('Erro ao chamar ai-chat:', error);
    throw error;
  }
}

/**
 * Helper para teste rápido no modo sandbox
 * Não requer autenticação, sempre retorna resposta local
 */
export async function testSandbox(message: string): Promise<ChatResponse> {
  return sendMessage(message);
}

/**
 * Helper para teste com GPT real
 * Requer token JWT válido
 */
export async function testGPT(message: string, token: string): Promise<ChatResponse> {
  return sendMessage(message, token);
}