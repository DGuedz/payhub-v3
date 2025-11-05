/**
 * Sistema de Rotação Automática de Tokens JWT
 * Implementa rotação periódica de tokens para mitigar riscos de vazamento
 */

export interface TokenRotationConfig {
  rotationInterval: number; // ms
  autoRotationEnabled: boolean;
  maxActiveTokens: number;
  tokenHistorySize: number;
}

export interface RotatedToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  rotatedFrom?: string;
  reason: 'scheduled' | 'security_incident' | 'manual';
}

export class TokenRotationSystem {
  private config: TokenRotationConfig;
  private activeTokens: Map<string, RotatedToken>;
  private tokenHistory: RotatedToken[];
  private rotationTimer?: NodeJS.Timeout;

  constructor(config?: Partial<TokenRotationConfig>) {
    this.config = {
      rotationInterval: config?.rotationInterval || 24 * 60 * 60 * 1000, // 24 horas
      autoRotationEnabled: config?.autoRotationEnabled ?? true,
      maxActiveTokens: config?.maxActiveTokens || 3,
      tokenHistorySize: config?.tokenHistorySize || 50
    };

    this.activeTokens = new Map();
    this.tokenHistory = [];

    if (this.config.autoRotationEnabled) {
      this.startAutoRotation();
    }
  }

  /**
   * Inicia rotação automática baseada no intervalo configurado
   */
  private startAutoRotation(): void {
    this.rotationTimer = setInterval(() => {
      this.rotateTokens('scheduled');
    }, this.config.rotationInterval);

    console.log(`Auto-rotacao de tokens iniciada. Intervalo: ${this.config.rotationInterval}ms`);
  }

  /**
   * Para a rotação automática
   */
  stopAutoRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
      console.log('Auto-rotacao de tokens parada');
    }
  }

  /**
   * Rotaciona todos os tokens ativos
   */
  async rotateTokens(reason: RotatedToken['reason'] = 'scheduled'): Promise<void> {
    console.log(`Iniciando rotacao de tokens. Motivo: ${reason}`);

    const currentTime = new Date();
    const tokensToRotate = Array.from(this.activeTokens.entries());

    for (const [tokenId, tokenData] of tokensToRotate) {
      try {
        const newToken = await this.generateNewToken(tokenData.token);
        const rotatedToken: RotatedToken = {
          token: newToken,
          createdAt: currentTime,
          expiresAt: new Date(currentTime.getTime() + this.config.rotationInterval),
          rotatedFrom: tokenId,
          reason
        };

        // Adiciona ao histórico
        this.addToHistory(rotatedToken);

        // Atualiza tokens ativos
        this.activeTokens.set(this.generateTokenId(newToken), rotatedToken);
        this.activeTokens.delete(tokenId);

        console.log(`Token rotacionado: ${tokenId.substring(0, 8)}... -> ${this.generateTokenId(newToken).substring(0, 8)}...`);

      } catch (error) {
        console.error(`Erro ao rotacionar token ${tokenId.substring(0, 8)}...:`, error);
      }
    }

    this.cleanupOldTokens();
    console.log('Rotacao de tokens concluida');
  }

  /**
   * Gera novo token (simulação - implementação real depende do seu sistema JWT)
   */
  private async generateNewToken(oldToken: string): Promise<string> {
    // Em um sistema real, aqui você geraria um novo JWT
    // Esta é uma implementação simplificada para demonstração
    const newToken = `rotated_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Simula processamento assíncrono
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return newToken;
  }

  /**
   * Adiciona token ao histórico com limite de tamanho
   */
  private addToHistory(token: RotatedToken): void {
    this.tokenHistory.unshift(token);
    
    // Mantém apenas o histórico mais recente
    if (this.tokenHistory.length > this.config.tokenHistorySize) {
      this.tokenHistory = this.tokenHistory.slice(0, this.config.tokenHistorySize);
    }
  }

  /**
   * Limpa tokens antigos baseado na configuração
   */
  private cleanupOldTokens(): void {
    const currentTime = new Date();
    
    // Remove tokens expirados
    for (const [tokenId, tokenData] of this.activeTokens.entries()) {
      if (tokenData.expiresAt < currentTime) {
        this.activeTokens.delete(tokenId);
        console.log(`Token expirado removido: ${tokenId.substring(0, 8)}...`);
      }
    }

    // Limita número máximo de tokens ativos
    if (this.activeTokens.size > this.config.maxActiveTokens) {
      const excess = this.activeTokens.size - this.config.maxActiveTokens;
      const tokensToRemove = Array.from(this.activeTokens.entries())
        .sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime())
        .slice(0, excess);

      for (const [tokenId] of tokensToRemove) {
        this.activeTokens.delete(tokenId);
        console.log(`Token antigo removido (limite excedido): ${tokenId.substring(0, 8)}...`);
      }
    }
  }

  /**
   * Gera ID único para o token
   */
  private generateTokenId(token: string): string {
    // Usa hash simples para identificar tokens
    return Buffer.from(token).toString('base64').substring(0, 16);
  }

  /**
   * Adiciona novo token ao sistema
   */
  addToken(token: string, expiresInMs: number = this.config.rotationInterval): string {
    const tokenId = this.generateTokenId(token);
    const currentTime = new Date();

    const tokenData: RotatedToken = {
      token,
      createdAt: currentTime,
      expiresAt: new Date(currentTime.getTime() + expiresInMs),
      reason: 'manual'
    };

    this.activeTokens.set(tokenId, tokenData);
    this.addToHistory(tokenData);

    console.log(`Novo token adicionado: ${tokenId.substring(0, 8)}...`);
    this.cleanupOldTokens();

    return tokenId;
  }

  /**
   * Remove token específico
   */
  removeToken(tokenId: string): boolean {
    const removed = this.activeTokens.delete(tokenId);
    if (removed) {
      console.log(`Token removido: ${tokenId.substring(0, 8)}...`);
    }
    return removed;
  }

  /**
   * Força rotação imediata por motivo de segurança
   */
  emergencyRotation(): Promise<void> {
    console.log('Rotacao de emergencia iniciada (possivel incidente de seguranca)');
    return this.rotateTokens('security_incident');
  }

  /**
   * Obtém estatísticas do sistema
   */
  getStats() {
    return {
      activeTokens: this.activeTokens.size,
      totalRotations: this.tokenHistory.length,
      lastRotation: this.tokenHistory[0]?.createdAt || null,
      nextRotation: this.rotationTimer ? new Date(Date.now() + this.config.rotationInterval) : null,
      autoRotationEnabled: this.config.autoRotationEnabled
    };
  }

  /**
   * Obtém histórico de rotações
   */
  getRotationHistory(limit: number = 10): RotatedToken[] {
    return this.tokenHistory.slice(0, limit);
  }

  /**
   * Limpa todos os tokens (uso em testes ou reset completo)
   */
  clearAll(): void {
    this.activeTokens.clear();
    this.tokenHistory = [];
    
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
    }

    console.log('Todos os tokens foram removidos. Sistema reiniciado.');
  }
}

// Singleton global para o sistema de rotação
let globalTokenRotationSystem: TokenRotationSystem | null = null;

export function getTokenRotationSystem(config?: Partial<TokenRotationConfig>): TokenRotationSystem {
  if (!globalTokenRotationSystem) {
    globalTokenRotationSystem = new TokenRotationSystem(config);
  }
  return globalTokenRotationSystem;
}

export function initializeTokenRotation(config?: Partial<TokenRotationConfig>): TokenRotationSystem {
  if (globalTokenRotationSystem) {
    globalTokenRotationSystem.stopAutoRotation();
  }
  
  globalTokenRotationSystem = new TokenRotationSystem(config);
  return globalTokenRotationSystem;
}