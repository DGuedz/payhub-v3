/**
 * Exemplo de uso do ai-chat-client em JavaScript/TypeScript puro
 * 
 * Demonstra como integrar o PAYHUB_V3 AI Chat em qualquer frontend
 * com autenticação JWT e fallback sandbox
 */

import { sendMessage, testSandbox } from './ai-chat-client';
import type { ChatResponse } from './ai-chat-client';

// Exemplo de integração em HTML vanilla
export function createAIChatExample() {
  return `
    <div id="ai-chat-demo" style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: #333; margin-bottom: 20px;">🤖 PAYHUB_V3 AI Chat Demo</h1>
      
      <div style="margin-bottom: 15px;">
        <label for="message-input" style="display: block; margin-bottom: 5px; font-weight: bold;">
          Mensagem para a IA:
        </label>
        <textarea 
          id="message-input" 
          rows="3" 
          style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"
          placeholder="Digite sua mensagem..."
        ></textarea>
      </div>

      <div style="margin-bottom: 15px;">
        <label for="token-input" style="display: block; margin-bottom: 5px; font-weight: bold;">
          Token JWT (opcional):
        </label>
        <input 
          type="text" 
          id="token-input" 
          style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"
          placeholder="Deixe vazio para modo sandbox"
        />
      </div>

      <div style="margin-bottom: 15px;">
        <button 
          id="send-btn" 
          style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;"
        >
          Enviar Mensagem
        </button>
        
        <button 
          id="sandbox-btn" 
          style="padding: 10px 20px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Testar Sandbox
        </button>
      </div>

      <div id="result" style="margin-top: 20px; padding: 15px; border-radius: 4px; display: none;"></div>

      <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
        <h3 style="margin-top: 0;">ℹ️ Informações:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Modo Sandbox: funciona sem token JWT (respostas locais)</li>
          <li>Modo GPT: requer autenticação e quota OpenAI</li>
          <li>Project Ref: nsdujmcxbifhssipszdp</li>
          <li>Endpoint: https://nsdujmcxbifhssipszdp.supabase.co/functions/v1/ai-chat</li>
        </ul>
      </div>
    </div>

    <script type="module">
      import { sendMessage, testSandbox } from './ai-chat-client.js';

      const sendBtn = document.getElementById('send-btn');
      const sandboxBtn = document.getElementById('sandbox-btn');
      const messageInput = document.getElementById('message-input');
      const tokenInput = document.getElementById('token-input');
      const resultDiv = document.getElementById('result');

      function showResult(response, error = null) {
        resultDiv.style.display = 'block';
        
        if (error) {
          resultDiv.style.backgroundColor = '#f8d7da';
          resultDiv.style.borderColor = '#f5c6cb';
          resultDiv.innerHTML = \`
            <strong>❌ Erro:</strong> \${error}
          \`;
          return;
        }

        const modeIcon = response.mode === 'sandbox' ? '🧩' : '🤖';
        const modeText = response.mode === 'sandbox' ? 'Sandbox' : 'GPT';
        
        resultDiv.style.backgroundColor = response.ok ? '#d4edda' : '#f8d7da';
        resultDiv.style.borderColor = response.ok ? '#c3e6cb' : '#f5c6cb';
        
        resultDiv.innerHTML = \`
          <div style="margin-bottom: 10px;">
            <strong>Status:</strong> \${response.ok ? '✅ Sucesso' : '❌ Erro'}
          </div>
          \${response.mode ? \`<div style="margin-bottom: 10px;"><strong>Modo:</strong> \${modeIcon} \${modeText}</div>\` : ''}
          \${response.reply ? \`<div><strong>Resposta:</strong><p style="margin-top: 5px; padding: 10px; background: white; border-radius: 4px;">\${response.reply}</p></div>\` : ''}
          \${response.error ? \`<div style="color: #721c24; margin-top: 10px;"><strong>Erro da API:</strong> \${response.error}</div>\` : ''}
        \`;
      }

      sendBtn.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        const token = tokenInput.value.trim();
        
        if (!message) {
          alert('Por favor, digite uma mensagem');
          return;
        }

        sendBtn.disabled = true;
        sendBtn.textContent = 'Enviando...';
        resultDiv.style.display = 'none';

        try {
          const response = await sendMessage(message, token || undefined);
          showResult(response);
        } catch (error) {
          showResult(null, error.message);
        } finally {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Enviar Mensagem';
        }
      });

      sandboxBtn.addEventListener('click', async () => {
        sandboxBtn.disabled = true;
        sandboxBtn.textContent = 'Testando...';
        resultDiv.style.display = 'none';

        try {
          const response = await testSandbox('Teste do modo sandbox PAYHUB_V3');
          showResult(response);
        } catch (error) {
          showResult(null, error.message);
        } finally {
          sandboxBtn.disabled = false;
          sandboxBtn.textContent = 'Testar Sandbox';
        }
      });
    </script>
  `;
}

// Exemplo de uso programático
export async function demonstrateAIChat() {
  console.log('🤖 Demonstrando PAYHUB_V3 AI Chat...\n');

  try {
    // Teste 1: Modo Sandbox (sem autenticação)
    console.log('1. Testando modo Sandbox:');
    const sandboxResponse = await testSandbox('Olá, PAYHUB_V3!');
    console.log('Resposta Sandbox:', sandboxResponse);

    // Teste 2: Com token JWT (se disponível)
    console.log('\n2. Teste com token JWT (exemplo):');
    const token = process.env.JWT_TOKEN || ''; // Token deve vir de variável de ambiente
    if (token) {
      const gptResponse = await sendMessage('Como posso ajudar no hackathon XRPL?', token);
      console.log('Resposta GPT:', gptResponse);
    } else {
      console.log('Token JWT não disponível - usando modo sandbox');
    }
    console.log('Resposta GPT:', gptResponse);

  } catch (error) {
    console.error('Erro na demonstração:', error);
  }
}

// Exporta funções úteis
export { sendMessage, testSandbox } from './ai-chat-client';