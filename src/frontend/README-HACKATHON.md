# 🤖 PAYHUB_V3 AI Chat - Hackathon XRPL Vega House

## 📋 Status: ✅ PRONTO PARA DEMO

A Edge Function `ai-chat` está totalmente funcional com modo **sandbox** (sem custos) e tratamento robusto de erros.

## 🚀 Teste Rápido (1 minuto)

### Opção 1: Sandbox (Sem Autenticação - Sem Custos)
```bash
curl -s -X POST "https://nsdujmcxbifhssipszdp.supabase.co/functions/v1/ai-chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Olá PAYHUB_V3! Como posso integrar XRPL?"}'
```

### Opção 2: Demo Interativa (Abrir HTML)
```bash
# Abra o arquivo no navegador
open src/frontend/hackathon-demo.html
```

### Opção 3: Teste com Token JWT (Quando houver quota OpenAI)
```bash
curl -s -X POST "https://nsdujmcxbifhssipszdp.supabase.co/functions/v1/ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"message":"Explique sobre XRPL e DeFi"}'
```

## 📁 Arquivos de Demo

| Arquivo | Descrição | Uso |
|---------|-----------|-----|
| `hackathon-demo.html` | Interface visual completa | Abrir no navegador |
| `ai-chat-client.ts` | Cliente TypeScript minimalista | Importar em projetos |
| `demo-usage.ts` | Exemplos de código | Referência de integração |
| `test-ai-chat.js` | Script de teste | Validação rápida |

## 🎯 Modos de Operação

### 🧩 Modo Sandbox (Atual)
- ✅ **Sem custos OpenAI**
- ✅ **Sem autenticação necessária**
- ✅ **Respostas locais simuladas**
- ✅ **Ideal para demonstrações**

```json
{
  "ok": true,
  "mode": "sandbox",
  "reply": "Simulação: Olá PAYHUB_V3! Como posso integrar XRPL?"
}
```

### 🤖 Modo GPT (Com quota OpenAI)
- ✅ **Integração real com OpenAI GPT-4o-mini**
- ✅ **Requer autenticação JWT**
- ✅ **Respostas inteligentes**
- ⚠️ **Requer quota ativa na conta OpenAI**

## 🔧 Integração Frontend (TypeScript)

```typescript
import { sendMessage, testSandbox } from './ai-chat-client';

// Demo sandbox (sem custos)
const response = await testSandbox("Olá PAYHUB_V3!");
console.log(response.reply); // "Simulação: Olá PAYHUB_V3!"

// Com autenticação (quando houver quota)
const jwt = await getUserToken(); // Seu sistema de auth
const response = await sendMessage("Como integrar XRPL?", jwt);
```

## 📊 Endpoints e Configurações

- **Project Ref**: `nsdujmcxbifhssipszdp`
- **Endpoint**: `https://nsdujmcxbifhssipszdp.supabase.co/functions/v1/ai-chat`
- **Método**: `POST`
- **Headers**: 
  - `Content-Type: application/json` (obrigatório)
  - `Authorization: Bearer <JWT>` (opcional - para modo GPT)

## 🎨 Personalização para Demo

### Mensagens Sugeridas para Teste:
1. "Olá PAYHUB_V3! Apresente o projeto"
2. "Como funciona a integração com XRPL?"
3. "Explique sobre pagamentos com criptomoedas"
4. "Qual é a missão do Vega House?"
5. "Como posso participar do hackathon?"

### Respostas de Sandbox Prontas:
- "Simulação: [sua mensagem] processada localmente"
- "Modo Sandbox ativo - demonstração sem custos OpenAI"
- "Sistema pronto para integração com XRPL e DeFi"

## ⚡ Comandos Úteis

### Verificar status da função:
```bash
npx supabase functions list
```

### Testar diferentes cenários:
```bash
# Mensagem vazia
curl -X POST "https://nsdujmcxbifhssipszdp.supabase.co/functions/v1/ai-chat" \
  -H "Content-Type: application/json" \
  -d '{}'

# JSON inválido
curl -X POST "https://nsdujmcxbifhssipszdp.supabase.co/functions/v1/ai-chat" \
  -H "Content-Type: application/json" \
  -d 'mensagem invalida'
```

## 🏆 Checklist Final Demo

- [x] Edge Function deployada e funcionando
- [x] Modo sandbox ativo (sem custos)
- [x] Tratamento de erros robusto
- [x] Interface visual HTML pronta
- [x] Cliente TypeScript minimalista
- [x] Exemplos de código documentados
- [x] Testes de integração validados

## 🎉 Sistema Pronto!

O PAYHUB_V3 AI Chat está **100% funcional** para demonstrações no hackathon XRPL Vega House. Use o modo sandbox para apresentações sem custos e sem complicações de autenticação!

**Boa sorte na apresentação!** 🚀