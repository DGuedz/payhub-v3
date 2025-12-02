/**
 * Sistema de Inicialização de Segurança
 * Integra todas as camadas de proteção e gerencia a inicialização segura
 */
// Declaração mínima para compatibilidade sem @types/node
declare const process: any;
declare const require: any;
declare const module: any;

import { getTokenRotationSystem, TokenRotationSystem } from './token-rotation-system';
import { env, EnvironmentManager } from './environment-manager';
import { getAccessMonitor, AccessMonitor } from './access-monitor';

interface SecurityInitConfig {
  autoTokenRotation: boolean;
  environmentValidation: boolean;
  accessMonitoring: boolean;
  emergencyProtocols: boolean;
}

export class SecurityInitSystem {
  private tokenSystem: TokenRotationSystem;
  private envManager: EnvironmentManager;
  private accessMonitor: AccessMonitor;
  private config: SecurityInitConfig;
  private isInitialized: boolean;

  constructor(config?: Partial<SecurityInitConfig>) {
    this.config = {
      autoTokenRotation: config?.autoTokenRotation ?? true,
      environmentValidation: config?.environmentValidation ?? true,
      accessMonitoring: config?.accessMonitoring ?? true,
      emergencyProtocols: config?.emergencyProtocols ?? true
    };

    this.isInitialized = false;
    
    // Inicializa sistemas
    this.tokenSystem = getTokenRotationSystem();
    this.envManager = env;
    this.accessMonitor = getAccessMonitor();
  }

  /**
   * Inicializa todos os sistemas de segurança
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Sistema de segurança já inicializado');
      return;
    }

    console.log(' Inicializando sistemas de segurança...');

    try {
      // 1. Validação de ambiente
      if (this.config.environmentValidation) {
        await this.validateEnvironment();
      }

      // 2. Inicialização de sistemas
      if (this.config.autoTokenRotation) {
        this.initializeTokenRotation();
      }

      if (this.config.accessMonitoring) {
        this.initializeAccessMonitoring();
      }

      if (this.config.emergencyProtocols) {
        this.setupEmergencyProtocols();
      }

      this.isInitialized = true;
      console.log(' Sistemas de segurança inicializados com sucesso');
      this.printSecurityStatus();

    } catch (error) {
      console.error(' Falha na inicialização de segurança:', error);
      const message = (error instanceof Error) ? error.message : String(error);
      throw new Error(`Erro na inicializacao de seguranca: ${message}`);
    }
  }

  /**
   * Valida todas as variáveis de ambiente
   */
  private async validateEnvironment(): Promise<void> {
    console.log(' Validando variáveis de ambiente...');

    if (!this.envManager.isValid()) {
      const errors = this.envManager.getValidationErrors();
      throw new Error(`Erros de validacao de ambiente: ${errors.join(', ')}`);
    }

    // Verifica se variáveis sensíveis não estão com valores padrão
    this.checkForDefaultSecrets();

    console.log(' Variáveis de ambiente validadas');
  }

  /**
   * Verifica se há segredos com valores padrão (inseguros)
   */
  private checkForDefaultSecrets(): void {
    const defaultSecrets = [
      'payhub-secure-secret-key',
      'your-',
      'example-',
      'test-',
      'demo-'
    ];

    const sensitiveVars = ['JWT_SECRET', 'JWT_TOKEN', 'FIGMA_TOKEN', 'VERCEL_TOKEN'];

    for (const varName of sensitiveVars) {
      try {
        const value = this.envManager.get(varName);
        
        if (value && defaultSecrets.some(secret => value.includes(secret))) {
          console.warn(`️  AVISO: ${varName} pode estar usando valor padrão inseguro`);
        }
      } catch {
        // Variável não configurada, ignora
      }
    }
  }

  /**
   * Inicializa sistema de rotação de tokens
   */
  private initializeTokenRotation(): void {
    console.log(' Inicializando rotação automática de tokens...');

    // Configura intervalo baseado em variável de ambiente
    const rotationInterval = this.envManager.get('TOKEN_ROTATION_INTERVAL');
    const autoRotation = this.envManager.get('AUTO_ROTATION_ENABLED');

    if (autoRotation) {
      console.log(`⏰ Rotaçao de tokens configurada para cada ${rotationInterval / 3600000} horas`);
    } else {
      console.log('⏸️  Rotaçao automática de tokens desativada');
    }

    // Força rotação inicial se tokens foram vazados recentemente
    this.handleEmergencyRotation();
  }

  /**
   * Inicializa monitoramento de acesso
   */
  private initializeAccessMonitoring(): void {
    console.log(' Inicializando monitoramento de acesso...');

    const retentionDays = this.envManager.get('LOG_RETENTION_DAYS');
    console.log(` Retençao de logs configurada para ${retentionDays} dias`);

    // Limpa logs antigos na inicialização
    this.accessMonitor.cleanupOldLogs(retentionDays);
  }

  /**
   * Configura protocolos de emergência
   */
  private setupEmergencyProtocols(): void {
    console.log(' Configurando protocolos de emergência...');

    // Handler para shutdown graceful
    this.setupShutdownHandler();

    // Handler para uncaught exceptions
    this.setupExceptionHandler();

    console.log(' Protocolos de emergência configurados');
  }

  /**
   * Configura handler para shutdown graceful
   */
  private setupShutdownHandler(): void {
    const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    shutdownSignals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n Recebido ${signal}. Desligando sistemas de segurança...`);
        
        await this.shutdown();
        process.exit(0);
      });
    });
  }

  /**
   * Configura handler para exceções não capturadas
   */
  private setupExceptionHandler(): void {
    process.on('uncaughtException', (error: any) => {
      console.error(' Exceção não capturada:', error);
      
      // Log de segurança para exceções críticas
      this.accessMonitor.logAccess({
        ipAddress: 'internal',
        userAgent: 'nodejs',
        endpoint: '/system/uncaught-exception',
        method: 'ERROR',
        statusCode: 500,
        responseTime: 0,
        requestSize: 0,
        responseSize: 0,
        metadata: {
          error: (error && error.message) ? error.message : String(error),
          stack: (error && error.stack) ? error.stack : undefined
        }
      });

      // Não encerra o processo imediatamente (depende da criticalidade)
      if (this.isCriticalError(error)) {
        console.error(' Erro crítico detectado. Encerrando processo...');
        process.exit(1);
      }
    });
  }

  /**
   * Verifica se erro é crítico
   */
  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      /memory|heap|out of memory/i,
      /database|connection|timeout/i,
      /security|authentication|authorization/i,
      /file system|permission|access denied/i
    ];

    return criticalPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stack || '')
    );
  }

  /**
   * Força rotação de emergência se necessário
   */
  private handleEmergencyRotation(): void {
    // Em produção, verificar se houve vazamento recente
    // Para agora, sempre forçar rotação na inicialização por segurança
    
    console.log(' Forçando rotação de tokens por segurança...');
    
    this.tokenSystem.emergencyRotation().catch(error => {
      console.warn('️  Não foi possível forçar rotação de tokens:', error);
    });
  }

  /**
   * Desliga todos os sistemas de segurança gracefulmente
   */
  public async shutdown(): Promise<void> {
    console.log(' Desligando sistemas de segurança...');

    try {
      // Para rotação automática de tokens
      this.tokenSystem.stopAutoRotation();

      // Limpa recursos
      this.accessMonitor.cleanupOldLogs(0); // Mantém apenas logs da sessão atual

      console.log(' Sistemas de segurança desligados');
    } catch (error) {
      console.error(' Erro ao desligar sistemas de segurança:', error);
    }
  }

  /**
   * Imprime status atual da segurança
   */
  public printSecurityStatus(): void {
    console.log('\n STATUS DE SEGURANÇA:');
    console.log('=======================');

    // Status do ambiente
    console.log(' Ambiente:', this.envManager.get('NODE_ENV'));
    console.log(' Validação de ambiente:', this.envManager.isValid() ? 'OK' : 'ERRO');

    // Status dos tokens
    const tokenStats = this.tokenSystem.getStats();
    console.log(' Rotaçao automática:', tokenStats.autoRotationEnabled ? 'ATIVADA' : 'DESATIVADA');
    console.log(' Tokens ativos:', tokenStats.activeTokens);

    // Status do monitoramento
    const accessStats = this.accessMonitor.getStats();
    console.log(' Logs de acesso:', accessStats.totalLogs);
    console.log(' Alertas de segurança:', accessStats.totalAlerts);

    if (accessStats.totalAlerts > 0) {
      console.log('️  Alertas nas últimas 24h:', accessStats.alertsLast24h);
    }

    console.log('=======================\n');
  }

  /**
   * Obtém instância do sistema de tokens
   */
  public getTokenSystem(): TokenRotationSystem {
    return this.tokenSystem;
  }

  /**
   * Obtém instância do gerenciador de ambiente
   */
  public getEnvManager(): EnvironmentManager {
    return this.envManager;
  }

  /**
   * Obtém instância do monitor de acesso
   */
  public getAccessMonitor(): AccessMonitor {
    return this.accessMonitor;
  }

  /**
   * Verifica se sistema está inicializado
   */
  public isSecurityInitialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton global
let globalSecurityInit: SecurityInitSystem | null = null;

export function getSecurityInitSystem(config?: Partial<SecurityInitConfig>): SecurityInitSystem {
  if (!globalSecurityInit) {
    globalSecurityInit = new SecurityInitSystem(config);
  }
  return globalSecurityInit;
}

export async function initializeSecurity(config?: Partial<SecurityInitConfig>): Promise<void> {
  const securitySystem = getSecurityInitSystem(config);
  return securitySystem.initialize();
}

export async function shutdownSecurity(): Promise<void> {
  if (globalSecurityInit) {
    return globalSecurityInit.shutdown();
  }
}

// Export helpers para acesso rápido
export {
  getTokenRotationSystem,
  env as environment,
  getAccessMonitor
};

// Execução CLI para inicialização de segurança
try {
  if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    const run = async () => {
      const system = getSecurityInitSystem();
      await system.initialize();
    };
    run().catch((err) => {
      const message = (err instanceof Error) ? err.message : String(err);
      console.error(' Falha na inicialização de segurança (CLI):', message);
      process?.exit?.(1);
    });
  }
} catch {}