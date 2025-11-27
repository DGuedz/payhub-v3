/**
 * Sistema de Monitoramento de Logs de Acesso
 * Detecta e alerta sobre acessos não autorizados
 */

interface AccessLog {
  timestamp: Date;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  metadata?: Record<string, any>;
}

interface SuspiciousPattern {
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface SecurityAlert {
  id: string;
  timestamp: Date;
  severity: string;
  pattern: string;
  description: string;
  logEntry: AccessLog;
  actionTaken?: string;
}

export class AccessMonitor {
  private accessLogs: AccessLog[];
  private securityAlerts: SecurityAlert[];
  private suspiciousPatterns: SuspiciousPattern[];
  private maxLogSize: number;
  private alertThreshold: number;

  constructor(maxLogSize: number = 10000, alertThreshold: number = 5) {
    this.accessLogs = [];
    this.securityAlerts = [];
    this.suspiciousPatterns = this.getDefaultPatterns();
    this.maxLogSize = maxLogSize;
    this.alertThreshold = alertThreshold;
  }

  /**
   * Padrões suspeitos padrão para detecção
   */
  private getDefaultPatterns(): SuspiciousPattern[] {
    return [
      {
        name: 'SQL Injection Attempt',
        pattern: /(union.*select|select.*union|insert.*into|drop.*table|exec\(|xp_cmdshell|--|;\s*--)/i,
        severity: 'high',
        description: 'Possível tentativa de injeção SQL detectada'
      },
      {
        name: 'XSS Attempt',
        pattern: /(<script|javascript:|onerror=|onload=|alert\(|document\.cookie|eval\(|fromCharCode)/i,
        severity: 'high',
        description: 'Possível tentativa de cross-site scripting detectada'
      },
      {
        name: 'Path Traversal',
        pattern: /(\.\.\/|\.\.\\|\/etc\/passwd|\/winnt\/|\.\.%2f|\.\.%5c)/i,
        severity: 'medium',
        description: 'Possível tentativa de path traversal detectada'
      },
      {
        name: 'Rapid Fire Requests',
        pattern: /.*/,
        severity: 'medium',
        description: 'Muitas requisições em curto período de tempo'
      },
      {
        name: 'Sensitive Endpoint Access',
        pattern: /\/(admin|config|env|secret|backup|database|api-key)/i,
        severity: 'critical',
        description: 'Acesso a endpoint sensível detectado'
      },
      {
        name: 'Invalid Authentication',
        pattern: /.*/,
        severity: 'medium',
        description: 'Múltiplas tentativas de autenticação inválidas'
      }
    ];
  }

  /**
   * Adiciona novo log de acesso e verifica por padrões suspeitos
   */
  public logAccess(accessLog: Omit<AccessLog, 'timestamp'>): void {
    const logEntry: AccessLog = {
      ...accessLog,
      timestamp: new Date()
    };

    this.accessLogs.push(logEntry);

    // Mantém tamanho máximo do log
    if (this.accessLogs.length > this.maxLogSize) {
      this.accessLogs = this.accessLogs.slice(-this.maxLogSize);
    }

    // Verifica padrões suspeitos
    this.checkSuspiciousPatterns(logEntry);

    // Verifica rate limiting
    this.checkRateLimiting(logEntry);

    // Verifica tentativas de autenticação
    this.checkAuthenticationAttempts(logEntry);
  }

  /**
   * Verifica padrões suspeitos no log de acesso
   */
  private checkSuspiciousPatterns(logEntry: AccessLog): void {
    for (const pattern of this.suspiciousPatterns) {
      const testString = `${logEntry.endpoint} ${logEntry.method} ${JSON.stringify(logEntry.metadata || {})}`;
      
      if (pattern.pattern.test(testString)) {
        this.createAlert({
          severity: pattern.severity,
          pattern: pattern.name,
          description: `${pattern.description} - Endpoint: ${logEntry.endpoint}`,
          logEntry
        });
      }
    }
  }

  /**
   * Verifica rate limiting por IP
   */
  private checkRateLimiting(logEntry: AccessLog): void {
    const timeWindow = 5 * 60 * 1000; // 5 minutos
    const threshold = 100; // 100 requisições por 5 minutos

    const recentRequests = this.accessLogs.filter(log => 
      log.ipAddress === logEntry.ipAddress &&
      log.timestamp.getTime() > Date.now() - timeWindow
    );

    if (recentRequests.length > threshold) {
      this.createAlert({
        severity: 'medium',
        pattern: 'Rate Limiting Exceeded',
        description: `IP ${logEntry.ipAddress} excedeu limite de requisições (${recentRequests.length} em 5min)`,
        logEntry
      });
    }
  }

  /**
   * Verifica tentativas de autenticação
   */
  private checkAuthenticationAttempts(logEntry: AccessLog): void {
    if (logEntry.endpoint.includes('/auth') && logEntry.statusCode === 401) {
      const timeWindow = 15 * 60 * 1000; // 15 minutos
      const threshold = 10; // 10 tentativas falhas

      const failedAuths = this.accessLogs.filter(log => 
        log.ipAddress === logEntry.ipAddress &&
        log.endpoint.includes('/auth') &&
        log.statusCode === 401 &&
        log.timestamp.getTime() > Date.now() - timeWindow
      );

      if (failedAuths.length >= threshold) {
        this.createAlert({
          severity: 'high',
          pattern: 'Multiple Failed Authentication',
          description: `IP ${logEntry.ipAddress} com ${failedAuths.length} tentativas de autenticação falhas`,
          logEntry
        });
      }
    }
  }

  /**
   * Cria alerta de segurança
   */
  private createAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp'>): void {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      ...alertData
    };

    this.securityAlerts.push(alert);

    // Notifica administradores (em produção, integrar com sistema de notificação)
    this.notifyAdmins(alert);

    console.warn(`ALERTA DE SEGURANCA [${alert.severity.toUpperCase()}]: ${alert.description}`);
  }

  /**
   * Gera ID único para alerta
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Notifica administradores sobre alerta
   */
  private notifyAdmins(alert: SecurityAlert): void {
    // Em produção, integrar com:
    // - Slack/Teams webhooks
    // - Email
    // - SMS
    // - Sistema de tickets
    
    const message = `
 ALERTA DE SEGURANCA 

Severidade: ${alert.severity.toUpperCase()}
Padrão: ${alert.pattern}
Descrição: ${alert.description}
IP: ${alert.logEntry.ipAddress}
Timestamp: ${alert.timestamp.toISOString()}
Endpoint: ${alert.logEntry.endpoint}
    `.trim();

    console.log(message);
    
    // Exemplo: Integração com sistema existente de incident response
    // incidentResponseSystem.handleSecurityAlert(alert);
  }

  /**
   * Adiciona padrão personalizado de detecção
   */
  public addSuspiciousPattern(pattern: SuspiciousPattern): void {
    this.suspiciousPatterns.push(pattern);
  }

  /**
   * Obtém logs de acesso recentes
   */
  public getRecentLogs(limit: number = 100): AccessLog[] {
    return this.accessLogs.slice(-limit);
  }

  /**
   * Obtém alertas de segurança
   */
  public getSecurityAlerts(severity?: string): SecurityAlert[] {
    let alerts = this.securityAlerts;
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Limpa logs antigos (baseado em retenção configurada)
   */
  public cleanupOldLogs(retentionDays: number = 30): void {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    this.accessLogs = this.accessLogs.filter(log => 
      log.timestamp.getTime() > cutoffTime
    );
    
    this.securityAlerts = this.securityAlerts.filter(alert => 
      alert.timestamp.getTime() > cutoffTime
    );

    console.log(`Logs limpos. Retidos ${this.accessLogs.length} logs dos últimos ${retentionDays} dias.`);
  }

  /**
   * Exporta logs para análise (formato seguro)
   */
  public exportLogs(): string {
    return JSON.stringify({
      accessLogs: this.accessLogs,
      securityAlerts: this.securityAlerts,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Estatísticas do sistema
   */
  public getStats() {
    const now = new Date();
    const last24h = now.getTime() - (24 * 60 * 60 * 1000);
    
    const recentLogs = this.accessLogs.filter(log => 
      log.timestamp.getTime() > last24h
    );
    
    const recentAlerts = this.securityAlerts.filter(alert => 
      alert.timestamp.getTime() > last24h
    );

    return {
      totalLogs: this.accessLogs.length,
      totalAlerts: this.securityAlerts.length,
      logsLast24h: recentLogs.length,
      alertsLast24h: recentAlerts.length,
      alertSeverityCount: this.countAlertsBySeverity(),
      topSuspiciousIPs: this.getTopSuspiciousIPs()
    };
  }

  /**
   * Conta alertas por severidade
   */
  private countAlertsBySeverity(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    this.securityAlerts.forEach(alert => {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
    });
    
    return counts;
  }

  /**
   * Obtém IPs mais suspeitos
   */
  private getTopSuspiciousIPs(): Array<{ip: string, alertCount: number}> {
    const ipCounts: Record<string, number> = {};
    
    this.securityAlerts.forEach(alert => {
      ipCounts[alert.logEntry.ipAddress] = (ipCounts[alert.logEntry.ipAddress] || 0) + 1;
    });
    
    return Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, alertCount: count }));
  }
}

// Singleton global para o monitor de acesso
let globalAccessMonitor: AccessMonitor | null = null;

export function getAccessMonitor(): AccessMonitor {
  if (!globalAccessMonitor) {
    globalAccessMonitor = new AccessMonitor();
  }
  return globalAccessMonitor;
}

export function initializeAccessMonitor(config?: {
  maxLogSize?: number;
  alertThreshold?: number;
}): AccessMonitor {
  globalAccessMonitor = new AccessMonitor(
    config?.maxLogSize,
    config?.alertThreshold
  );
  return globalAccessMonitor;
}

// Middleware express.js example
export function accessMonitorMiddleware() {
  const monitor = getAccessMonitor();
  
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      monitor.logAccess({
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || '',
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        requestSize: parseInt(req.get('Content-Length') || '0'),
        responseSize: parseInt(res.get('Content-Length') || '0'),
        metadata: {
          userId: req.user?.id,
          sessionId: req.session?.id
        }
      });
    });
    
    next();
  };
}