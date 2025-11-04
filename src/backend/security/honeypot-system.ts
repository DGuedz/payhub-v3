/**
 * Sistema de Honeypot PAYHUB_V3 - Defesa Ativa contra Intrusão
 * 
 * Este módulo implementa carteiras isca XRPL que funcionam como sensores de intrusão,
 * detectando atividades maliciosas e acionando respostas automáticas.
 */

// Gerador de endereços XRPL simulados para honeypot
function generateXRPLAddress(): string {
  const chars = 'r123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let address = 'r';
  const length = 25 + Math.floor(Math.random() * 10);
  for (let i = 0; i < length; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

function generateXRPLSeed(): string {
  const chars = 's123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let seed = 's';
  for (let i = 0; i < 28; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return seed;
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export interface HoneypotWallet {
  address: string;
  seed: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  lastActivity?: Date;
  metadata: {
    description: string;
    sensitivity: 'low' | 'medium' | 'high';
    alertLevel: number;
  };
}

export interface HoneypotEvent {
  walletAddress: string;
  eventType: 'transaction_attempt' | 'balance_check' | 'metadata_request';
  timestamp: Date;
  sourceIp?: string;
  userAgent?: string;
  transactionDetails?: any;
  riskScore: number;
}

export interface SecurityAlert {
  id: string;
  type: 'honeypot_triggered' | 'suspicious_activity' | 'brute_force_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  walletAddress: string;
  description: string;
  timestamp: Date;
  metadata: Record<string, any>;
  actionsTaken: string[];
}

/**
 * Gerenciador de Honeypots PAYHUB
 * Cria e gerencia carteiras isca para detecção de intrusão
 */
export class HoneypotManager {
  private honeypotWallets: Map<string, HoneypotWallet> = new Map();
  private eventLog: HoneypotEvent[] = [];
  private alertCallbacks: Array<(alert: SecurityAlert) => void> = [];
  private readonly MAX_WALLETS = 10;
  private readonly ALERT_THRESHOLDS = {
    low: 1,
    medium: 3,
    high: 5,
    critical: 10
  };

  constructor() {
    this.initializeHoneypotWallets();
  }

  /**
   * Inicializa carteiras isca com diferentes níveis de sensibilidade
   */
  private initializeHoneypotWallets(): void {
    const walletConfigs = [
      {
        description: "Tesouraria Principal - Reserva de Liquidez",
        sensitivity: "high" as const,
        balance: 1000
      },
      {
        description: "Escrow Operations - Fundos em Custódia",
        sensitivity: "high" as const,
        balance: 500
      },
      {
        description: "Pagamentos Instantâneos - Buffer ODL",
        sensitivity: "medium" as const,
        balance: 200
      },
      {
        description: "Financiamento Colateralizado - Garantias",
        sensitivity: "medium" as const,
        balance: 150
      },
      {
        description: "Testnet Operations - Desenvolvimento",
        sensitivity: "low" as const,
        balance: 50
      }
    ];

    walletConfigs.forEach((config, index) => {
      this.createHoneypotWallet(config.description, config.sensitivity, config.balance);
    });
  }

  /**
   * Cria uma nova carteira isca
   */
  private createHoneypotWallet(
    description: string,
    sensitivity: 'low' | 'medium' | 'high',
    balance: number
  ): HoneypotWallet {
    const address = generateXRPLAddress();
    const seed = generateXRPLSeed();
    const honeypotWallet: HoneypotWallet = {
      address,
      seed,
      balance,
      isActive: true,
      createdAt: new Date(),
      metadata: {
        description,
        sensitivity,
        alertLevel: this.ALERT_THRESHOLDS[sensitivity]
      }
    };

    this.honeypotWallets.set(honeypotWallet.address, honeypotWallet);
    console.log(`🍯 Honeypot criado: ${honeypotWallet.address} (${description})`);
    
    return honeypotWallet;
  }

  /**
   * Registra atividade em uma carteira isca
   */
  public async recordActivity(
    walletAddress: string,
    eventType: HoneypotEvent['eventType'],
    metadata?: {
      sourceIp?: string;
      userAgent?: string;
      transactionDetails?: any;
    }
  ): Promise<SecurityAlert | null> {
    
    const wallet = this.honeypotWallets.get(walletAddress);
    if (!wallet || !wallet.isActive) {
      return null;
    }

    const event: HoneypotEvent = {
      walletAddress,
      eventType,
      timestamp: new Date(),
      sourceIp: metadata?.sourceIp,
      userAgent: metadata?.userAgent,
      transactionDetails: metadata?.transactionDetails,
      riskScore: this.calculateRiskScore(wallet, eventType, metadata)
    };

    this.eventLog.push(event);
    wallet.lastActivity = new Date();

    // Verificar se deve gerar alerta
    if (this.shouldGenerateAlert(wallet, event)) {
      return this.generateSecurityAlert(wallet, event);
    }

    return null;
  }

  /**
   * Calcula score de risco baseado no evento
   */
  private calculateRiskScore(
    wallet: HoneypotWallet,
    eventType: HoneypotEvent['eventType'],
    metadata?: any
  ): number {
    let score = 0;

    // Baseado na sensibilidade da carteira
    const sensitivityMultiplier = {
      low: 1,
      medium: 2,
      high: 5
    };

    score += sensitivityMultiplier[wallet.metadata.sensitivity];

    // Baseado no tipo de evento
    const eventTypeScores = {
      transaction_attempt: 10,
      balance_check: 3,
      metadata_request: 5
    };

    score += eventTypeScores[eventType];

    // Fatores adicionais
    if (metadata?.sourceIp) {
      score += this.analyzeIpRisk(metadata.sourceIp);
    }

    if (metadata?.transactionDetails) {
      score += this.analyzeTransactionRisk(metadata.transactionDetails, wallet.balance);
    }

    return Math.min(score, 100); // Limite máximo
  }

  /**
   * Analisa risco do IP de origem
   */
  private analyzeIpRisk(ip: string): number {
    // Implementar análise mais sofisticada (geo-localização, blacklists, etc.)
    const suspiciousPatterns = [
      /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/, // IPs privados
      /^(127\.|0\.0\.0\.0|::1)/, // Localhost
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(ip)) {
        return 15; // Alto risco para IPs suspeitos
      }
    }

    return 0;
  }

  /**
   * Analisa risco da transação
   */
  private analyzeTransactionRisk(transactionDetails: any, walletBalance: number): number {
    let score = 0;

    // Verificar valores incomuns
    if (transactionDetails.Amount && transactionDetails.Amount > walletBalance) {
      score += 20; // Tentativa de transação maior que o saldo
    }

    // Verificar destinatário suspeito
    if (transactionDetails.Destination) {
      const suspiciousDestinations = [
        'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', // Endereços conhecidos de scammers
      ];

      if (suspiciousDestinations.includes(transactionDetails.Destination)) {
        score += 25;
      }
    }

    return score;
  }

  /**
   * Verifica se deve gerar alerta de segurança
   */
  private shouldGenerateAlert(wallet: HoneypotWallet, event: HoneypotEvent): boolean {
    // Verificar limite de alertas baseado na sensibilidade
    const recentEvents = this.getRecentEvents(wallet.address, 3600); // Última hora
    const alertThreshold = wallet.metadata.alertLevel;

    if (recentEvents.length >= alertThreshold) {
      return true;
    }

    // Verificar eventos de alto risco
    if (event.riskScore > 50) {
      return true;
    }

    return false;
  }

  /**
   * Obtém eventos recentes de uma carteira
   */
  private getRecentEvents(walletAddress: string, timeWindowSeconds: number): HoneypotEvent[] {
    const cutoffTime = new Date(Date.now() - timeWindowSeconds * 1000);
    
    return this.eventLog.filter(event => 
      event.walletAddress === walletAddress && 
      event.timestamp > cutoffTime
    );
  }

  /**
   * Gera alerta de segurança
   */
  private generateSecurityAlert(
    wallet: HoneypotWallet,
    triggerEvent: HoneypotEvent
  ): SecurityAlert {
    const alert: SecurityAlert = {
      id: simpleHash(`${wallet.address}-${Date.now()}`),
      type: 'honeypot_triggered',
      severity: wallet.metadata.sensitivity === 'high' ? 'critical' : 
                wallet.metadata.sensitivity === 'medium' ? 'high' : 'medium',
      walletAddress: wallet.address,
      description: `Atividade suspeita detectada na carteira isca: ${wallet.metadata.description}`,
      timestamp: new Date(),
      metadata: {
        triggerEvent,
        recentEvents: this.getRecentEvents(wallet.address, 3600),
        walletBalance: wallet.balance,
        riskScore: triggerEvent.riskScore
      },
      actionsTaken: []
    };

    // Executar ações de segurança
    this.executeSecurityActions(alert);
    
    // Notificar callbacks registrados
    this.notifyAlertCallbacks(alert);

    return alert;
  }

  /**
   * Executa ações de segurança automáticas
   */
  private executeSecurityActions(alert: SecurityAlert): void {
    const actions: string[] = [];

    // Desativar carteira isca (se alta severidade)
    if (alert.severity === 'critical' || alert.severity === 'high') {
      const wallet = this.honeypotWallets.get(alert.walletAddress);
      if (wallet) {
        wallet.isActive = false;
        actions.push('Carteira isca desativada');
      }
    }

    // Registrar tentativa de intrusão
    actions.push('Evento de intrusão registrado');

    // Adicionar IP à lista de observação (se disponível)
    if (alert.metadata.triggerEvent.sourceIp) {
      actions.push(`IP ${alert.metadata.triggerEvent.sourceIp} adicionado à lista de observação`);
    }

    alert.actionsTaken = actions;
  }

  /**
   * Registra callback para notificações de alerta
   */
  public onAlert(callback: (alert: SecurityAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Notifica todos os callbacks sobre novo alerta
   */
  private notifyAlertCallbacks(alert: SecurityAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Erro ao notificar callback de segurança:', error);
      }
    });
  }

  /**
   * Obtém estatísticas de segurança
   */
  public getSecurityStats(): {
    totalWallets: number;
    activeWallets: number;
    totalEvents: number;
    totalAlerts: number;
    alertsBySeverity: Record<string, number>;
    topRiskyWallets: Array<{ address: string; riskScore: number; events: number }>;
  } {
    const alertsBySeverity = this.eventLog.reduce((acc, event) => {
      const severity = event.riskScore > 50 ? 'high' : event.riskScore > 25 ? 'medium' : 'low';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const walletStats = Array.from(this.honeypotWallets.values()).map(wallet => {
      const walletEvents = this.eventLog.filter(e => e.walletAddress === wallet.address);
      const avgRiskScore = walletEvents.reduce((sum, e) => sum + e.riskScore, 0) / walletEvents.length || 0;
      
      return {
        address: wallet.address,
        riskScore: Math.round(avgRiskScore),
        events: walletEvents.length
      };
    }).sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);

    return {
      totalWallets: this.honeypotWallets.size,
      activeWallets: Array.from(this.honeypotWallets.values()).filter(w => w.isActive).length,
      totalEvents: this.eventLog.length,
      totalAlerts: this.eventLog.filter(e => e.riskScore > 25).length,
      alertsBySeverity,
      topRiskyWallets: walletStats
    };
  }

  /**
   * Simula ataque para testes
   */
  public simulateAttack(walletAddress: string, attackType: 'brute_force' | 'transaction_attempt' | 'reconnaissance'): void {
    const attackScenarios = {
      brute_force: {
        eventType: 'metadata_request' as const,
        metadata: { sourceIp: '192.168.1.100', userAgent: 'attack-bot/1.0' }
      },
      transaction_attempt: {
        eventType: 'transaction_attempt' as const,
        metadata: {
          transactionDetails: {
            Amount: '1000000', // Valor alto
            Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
          }
        }
      },
      reconnaissance: {
        eventType: 'balance_check' as const,
        metadata: { sourceIp: '10.0.0.1' }
      }
    };

    const scenario = attackScenarios[attackType];
    this.recordActivity(walletAddress, scenario.eventType, scenario.metadata);
  }
}

// Exportar instância singleton
export const honeypotManager = new HoneypotManager();