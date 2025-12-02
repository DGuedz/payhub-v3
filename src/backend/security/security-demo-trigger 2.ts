// Demonstração Ultra-Simples — Honeypot Trigger + Entropia Modular
// Objetivo: provar gatilho honeypot e invalidação forçada de sessões (defesa ativa)

import { honeypotManager } from './honeypot-system.js';
import { mfaJWTSystem } from './mfa-jwt-system.js';

async function main() {
  // 1) Criar sessão mock segura para um usuário demo (sem segredos reais)
  const jwtMock = {
    accessToken: 'demo-access',
    refreshToken: 'demo-refresh',
    tokenType: 'Bearer' as const,
    expiresIn: 900,
    scope: ['payments', 'escrow'],
    sessionId: 'demo-session',
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  };
  const session = mfaJWTSystem.createSession('demo-user', jwtMock, true, {
    fingerprint: 'demo-fp',
    userAgent: 'demo-agent',
    ipAddress: '127.0.0.1',
  });

  // 2) Simular ataque honeypot numa carteira fictícia
  const testWallet = 'rDemoHoneypot123456789';
  honeypotManager.simulateAttack(testWallet, 'transaction_attempt');

  // 3) Gatilho de Entropia Modular: invalidar sessões do usuário
  const invalidated = mfaJWTSystem.invalidateUserSessions('demo-user');

  // 4) Saída mínima de prova de conceito
  // Logs de console aqui são aceitáveis para demo; backend usa logger padronizado.
  console.log(`Honeypot → attack on ${testWallet}; sessions invalidated: ${invalidated}; demo session: ${session.sessionId}`);
}

main().catch((err) => {
  console.error('Demo trigger error:', err?.message || String(err));
  process.exit(1);
});