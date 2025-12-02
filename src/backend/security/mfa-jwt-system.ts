/**
 * Sistema MFA e JWT PAYHUB_V3 - Segurança Institucional
 * 
 * Implementa autenticação multi-fator e tokens JWT com segurança
 * de nível institucional para proteção contra ataques de força bruta.
 */

export interface MFACredentials {
  userId: string;
  factor1: string; // Senha ou biometria
  factor2: string; // TOTP, SMS, email, hardware token
  factorType: 'totp' | 'sms' | 'email' | 'hardware' | 'biometric';
  deviceInfo?: {
    fingerprint?: string;
    userAgent?: string;
    ipAddress?: string;
    geolocation?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface JWTToken {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string[];
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
}

export interface SecuritySession {
  sessionId: string;
  userId: string;
  jwtToken: JWTToken;
  mfaVerified: boolean;
  deviceInfo: MFACredentials['deviceInfo'];
  loginAttempts: number;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  riskScore: number;
}

export interface BruteForceProtection {
  attempts: number;
  lastAttempt: Date;
  lockoutUntil?: Date;
  isLocked: boolean;
  lockoutDuration: number;
  maxAttempts: number;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiration: number; // seconds
  jwtRefreshExpiration: number; // seconds
  mfaExpiration: number; // seconds
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  requireMFA: boolean;
  deviceFingerprinting: boolean;
  geolocationCheck: boolean;
  sessionTimeout: number; // minutes
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
  };
}

/**
 * Gerador de TOTP (Time-based One-Time Password)
 */
class TOTPGenerator {
  private static readonly DIGITS = 6;
  private static readonly PERIOD = 30; // seconds
  private static readonly ALGORITHM = 'SHA-256';

  /**
   * Gera código TOTP baseado em segredo e timestamp
   */
  static generate(secret: string, timestamp: number = Date.now()): string {
    const timeStep = Math.floor(timestamp / 1000 / this.PERIOD);
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setBigUint64(0, BigInt(timeStep), false);

    // Simular HMAC (em produção usar biblioteca criptográfica)
    const hmac = this.simulateHMAC(secret, timeBuffer);
    const offset = hmac[hmac.length - 1] & 0x0F;
    
    const binary = ((hmac[offset] & 0x7F) << 24) |
                   ((hmac[offset + 1] & 0xFF) << 16) |
                   ((hmac[offset + 2] & 0xFF) << 8) |
                   (hmac[offset + 3] & 0xFF);

    const otp = binary % Math.pow(10, this.DIGITS);
    return otp.toString().padStart(this.DIGITS, '0');
  }

  /**
   * Verifica se um código TOTP é válido
   */
  static verify(code: string, secret: string, window: number = 1): boolean {
    const currentTime = Date.now();
    
    // Verificar janela temporal (± window períodos)
    for (let i = -window; i <= window; i++) {
      const testTimestamp = currentTime + (i * this.PERIOD * 1000);
      const testCode = this.generate(secret, testTimestamp);
      
      if (testCode === code) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Simula HMAC (para ambiente de demonstração)
   * Em produção, usar biblioteca criptográfica real
   */
  private static simulateHMAC(secret: string, data: ArrayBuffer): Uint8Array {
    // Simulação simples para demonstração
    const secretBytes = new TextEncoder().encode(secret);
    const dataBytes = new Uint8Array(data);
    
    // Combinação simples (NÃO usar em produção)
    const combined = new Uint8Array(secretBytes.length + dataBytes.length);
    combined.set(secretBytes);
    combined.set(dataBytes, secretBytes.length);
    
    // Hash simples (simulado)
    const hash = new Uint8Array(32);
    for (let i = 0; i < combined.length; i++) {
      hash[i % 32] ^= combined[i];
    }
    
    return hash;
  }
}

/**
 * Gerenciador de Sessões com Proteção contra Força Bruta
 */
class SessionManager {
  private sessions: Map<string, SecuritySession> = new Map();
  private bruteForceProtection: Map<string, BruteForceProtection> = new Map();
  private readonly config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Verifica proteção contra força bruta (público para uso externo)
   */
  public checkBruteForceProtection(identifier: string): boolean {
    const protection = this.bruteForceProtection.get(identifier) || {
      attempts: 0,
      lastAttempt: new Date(),
      isLocked: false,
      lockoutDuration: this.config.lockoutDuration * 60 * 1000,
      maxAttempts: this.config.maxLoginAttempts
    };

    // Verificar se está bloqueado
    if (protection.isLocked && protection.lockoutUntil) {
      if (new Date() < protection.lockoutUntil) {
        return false;
      } else {
        // Lockout expirou, resetar
        protection.isLocked = false;
        protection.lockoutUntil = undefined;
        protection.attempts = 0;
      }
    }

    // Verificar número de tentativas
    if (protection.attempts >= protection.maxAttempts) {
      protection.isLocked = true;
      protection.lockoutUntil = new Date(Date.now() + protection.lockoutDuration);
      this.bruteForceProtection.set(identifier, protection);
      return false;
    }

    return true;
  }

  /**
   * Registra tentativa de login
   */
  public recordLoginAttempt(identifier: string, success: boolean): void {
    const protection = this.bruteForceProtection.get(identifier) || {
      attempts: 0,
      lastAttempt: new Date(),
      isLocked: false,
      lockoutDuration: this.config.lockoutDuration * 60 * 1000,
      maxAttempts: this.config.maxLoginAttempts
    };

    protection.lastAttempt = new Date();
    
    if (success) {
      // Resetar em caso de sucesso
      protection.attempts = 0;
      protection.isLocked = false;
      protection.lockoutUntil = undefined;
    } else {
      protection.attempts++;
    }

    this.bruteForceProtection.set(identifier, protection);
  }

  /**
   * Calcula score de risco baseado em device info
   */
  private calculateRiskScore(deviceInfo?: MFACredentials['deviceInfo']): number {
    let riskScore = 0;

    if (!deviceInfo) {
      riskScore += 30; // Alto risco se não houver info do device
      return riskScore;
    }

    // Análise de fingerprint
    if (!deviceInfo.fingerprint) {
      riskScore += 15;
    }

    // Análise de IP
    if (deviceInfo.ipAddress) {
      // IPs privados ou localhost são suspeitos
      if (deviceInfo.ipAddress.startsWith('192.168.') || 
          deviceInfo.ipAddress.startsWith('10.') || 
          deviceInfo.ipAddress === '127.0.0.1') {
        riskScore += 20;
      }
    }

    // Análise de geolocalização
    if (deviceInfo.geolocation) {
      // Coordenadas suspeitas (0,0 ou fora do range válido)
      if (deviceInfo.geolocation.latitude === 0 && deviceInfo.geolocation.longitude === 0) {
        riskScore += 25;
      }
      if (Math.abs(deviceInfo.geolocation.latitude) > 90 || Math.abs(deviceInfo.geolocation.longitude) > 180) {
        riskScore += 25;
      }
    }

    // User agent suspeito
    if (deviceInfo.userAgent) {
      if (deviceInfo.userAgent.includes('bot') || deviceInfo.userAgent.includes('curl')) {
        riskScore += 20;
      }
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Cria nova sessão segura
   */
  public createSession(
    userId: string,
    jwtToken: JWTToken,
    mfaVerified: boolean,
    deviceInfo?: MFACredentials['deviceInfo']
  ): SecuritySession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.sessionTimeout * 60 * 1000);

    const session: SecuritySession = {
      sessionId,
      userId,
      jwtToken,
      mfaVerified,
      deviceInfo,
      loginAttempts: 0,
      lastActivity: now,
      createdAt: now,
      expiresAt,
      isActive: true,
      riskScore: this.calculateRiskScore(deviceInfo)
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Valida e atualiza sessão
   */
  public validateSession(sessionId: string): SecuritySession | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Verificar expiração
    if (new Date() > session.expiresAt) {
      this.invalidateSession(sessionId);
      return null;
    }

    // Verificar se está ativa
    if (!session.isActive) {
      return null;
    }

    // Verificar se precisa de MFA
    if (this.config.requireMFA && !session.mfaVerified) {
      return null;
    }

    // Atualizar última atividade
    session.lastActivity = new Date();
    
    // Verificar risco
    if (session.riskScore > 70) {
      console.warn(`️ Sessão de alto risco detectada: ${sessionId}`);
    }

    return session;
  }

  /**
   * Invalida sessão
   */
  public invalidateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.expiresAt = new Date(); // Expirar imediatamente
      console.log(` Sessão invalidada: ${sessionId}`);
      return true;
    }
    return false;
  }

  /**
   * Invalida todas as sessões de um usuário
   */
  public invalidateUserSessions(userId: string): number {
    let invalidatedCount = 0;
    
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.isActive) {
        session.isActive = false;
        session.expiresAt = new Date();
        invalidatedCount++;
      }
    }

    console.log(` Sessões invalidadas para usuário ${userId}: ${invalidatedCount}`);
    return invalidatedCount;
  }

  /**
   * Obtém todas as sessões (getter público)
   */
  public getAllSessions(): SecuritySession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Obtém dados de força bruta (getter público)
   */
  public getBruteForceData(): BruteForceProtection[] {
    return Array.from(this.bruteForceProtection.values());
  }
}

/**
 * Gerador JWT com segurança institucional
 */
class JWTGenerator {
  private readonly config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Gera token JWT seguro
   */
  generateToken(
    payload: Record<string, any>,
    type: 'access' | 'refresh' = 'access'
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const expiration = type === 'access' ? this.config.jwtExpiration : this.config.jwtRefreshExpiration;
    
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiration,
      type,
      jti: `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nonce: Math.random().toString(36).substr(2, 15)
    };

    // Em produção, usar biblioteca JWT real com assinatura HMAC/RSA
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(tokenPayload));
    const signature = this.simulateSignature(encodedHeader + '.' + encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Simula assinatura JWT (para demonstração)
   */
  private simulateSignature(data: string): string {
    // Simulação de HMAC (NÃO usar em produção)
    const secret = this.config.jwtSecret;
    let hash = 0;
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return btoa(hash.toString());
  }

  /**
   * Verifica e decodifica token JWT
   */
  verifyToken(token: string): Record<string, any> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      
      // Verificar expiração
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      // Verificar assinatura (simplificada)
      const expectedSignature = this.simulateSignature(parts[0] + '.' + parts[1]);
      if (parts[2] !== expectedSignature) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Sistema MFA e JWT Principal
 */
export class MFAJWTSystem {
  private sessionManager: SessionManager;
  private jwtGenerator: JWTGenerator;
  private totpGenerator = TOTPGenerator;
  private config: SecurityConfig;
  private userSecrets: Map<string, string> = new Map(); // Simulação - usar banco em produção

  constructor(config?: Partial<SecurityConfig>) {
    const jwtSecret = typeof Deno !== 'undefined' ? Deno.env.get("JWT_SECRET") : process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    this.config = {
      jwtSecret: jwtSecret,
      jwtExpiration: 900, // 15 minutos
      jwtRefreshExpiration: 86400, // 24 horas
      mfaExpiration: 300, // 5 minutos
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutos
      requireMFA: true,
      deviceFingerprinting: true,
      geolocationCheck: true,
      sessionTimeout: 60, // minutos
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90 // dias
      },
      ...config
    };

    this.sessionManager = new SessionManager(this.config);
    this.jwtGenerator = new JWTGenerator(this.config);
  }

  /**
   * Cria sessão segura (delegação pública para o demo/honeypot)
   */
  public createSession(
    userId: string,
    jwtToken: JWTToken,
    mfaVerified: boolean,
    deviceInfo?: MFACredentials['deviceInfo']
  ): SecuritySession {
    return this.sessionManager.createSession(userId, jwtToken, mfaVerified, deviceInfo);
  }

  /**
   * Inicia processo de autenticação MFA
   */
  public async initiateMFA(userId: string, factorType: MFACredentials['factorType']): Promise<{
    mfaId: string;
    expiresAt: Date;
    nextStep: 'enter_code' | 'verify_device';
  }> {
    const mfaId = `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + this.config.mfaExpiration * 1000);

    // Gerar segredo TOTP se necessário
    if (factorType === 'totp' && !this.userSecrets.has(userId)) {
      const secret = this.generateTOTPSecret();
      this.userSecrets.set(userId, secret);
      console.log(` TOTP Secret gerado para ${userId}: ${secret}`);
    }

    return {
      mfaId,
      expiresAt,
      nextStep: factorType === 'totp' ? 'enter_code' : 'verify_device'
    };
  }

  /**
   * Gera segredo TOTP
   */
  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Verifica MFA
   */
  public async verifyMFA(
    userId: string,
    mfaCredentials: MFACredentials
  ): Promise<{
    success: boolean;
    session?: SecuritySession;
    error?: string;
  }> {
    // Verificar proteção contra força bruta
    if (!this.sessionManager.checkBruteForceProtection(userId)) {
      return {
        success: false,
        error: 'Conta temporariamente bloqueada devido a múltiplas tentativas'
      };
    }

    // Verificar fator 1 (senha) - simulação
    const passwordValid = await this.verifyPassword(userId, mfaCredentials.factor1);
    
    if (!passwordValid) {
      this.sessionManager.recordLoginAttempt(userId, false);
      return {
        success: false,
        error: 'Credenciais inválidas'
      };
    }

    // Verificar fator 2 baseado no tipo
    let factor2Valid = false;
    
    switch (mfaCredentials.factorType) {
      case 'totp':
        const secret = this.userSecrets.get(userId);
        if (secret) {
          factor2Valid = this.totpGenerator.verify(mfaCredentials.factor2, secret);
        }
        break;
        
      case 'sms':
      case 'email':
        // Simulação - em produção integrar com serviços reais
        factor2Valid = mfaCredentials.factor2.length === 6 && /^\d+$/.test(mfaCredentials.factor2);
        break;
        
      case 'hardware':
        // Simulação de token hardware
        factor2Valid = mfaCredentials.factor2.length >= 8;
        break;
        
      case 'biometric':
        // Simulação de biometria
        factor2Valid = mfaCredentials.factor2 === 'biometric_verified';
        break;
    }

    if (!factor2Valid) {
      this.sessionManager.recordLoginAttempt(userId, false);
      return {
        success: false,
        error: 'Segundo fator inválido'
      };
    }

    // MFA verificado com sucesso
    this.sessionManager.recordLoginAttempt(userId, true);

    // Gerar tokens JWT
    const accessToken = this.jwtGenerator.generateToken({
      userId,
      scope: ['read', 'write'],
      mfa_verified: true
    }, 'access');

    const refreshToken = this.jwtGenerator.generateToken({
      userId,
      scope: ['refresh'],
      mfa_verified: true
    }, 'refresh');

    const jwtToken: JWTToken = {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.jwtExpiration,
      scope: ['read', 'write'],
      sessionId: `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.jwtExpiration * 1000)
    };

    // Criar sessão segura
    const session = this.sessionManager.createSession(
      userId,
      jwtToken,
      true,
      mfaCredentials.deviceInfo
    );

    console.log(` MFA verificado com sucesso para ${userId}`);
    console.log(` Sessão criada: ${session.sessionId}`);
    console.log(`️ Score de risco: ${session.riskScore}`);

    return {
      success: true,
      session
    };
  }

  /**
   * Verifica senha (simulação)
   */
  private async verifyPassword(userId: string, password: string): Promise<boolean> {
    // Simulação - em produção usar hash seguro (bcrypt, scrypt, etc.)
    return password.length >= this.config.passwordPolicy.minLength;
  }

  /**
   * Valida token JWT
   */
  public validateToken(token: string): SecuritySession | null {
    const payload = this.jwtGenerator.verifyToken(token);
    
    if (!payload) {
      return null;
    }

    // Validar sessão associada
    const sessionId = payload.jti || payload.sessionId;
    if (!sessionId) {
      return null;
    }

    return this.sessionManager.validateSession(sessionId);
  }

  /**
   * Renova token de acesso
   */
  public refreshAccessToken(refreshToken: string): {
    success: boolean;
    newAccessToken?: string;
    error?: string;
  } {
    const payload = this.jwtGenerator.verifyToken(refreshToken);
    
    if (!payload || payload.type !== 'refresh') {
      return { success: false, error: 'Token de refresh inválido' };
    }

    const userId = payload.userId;
    
    // Gerar novo token de acesso
    const newAccessToken = this.jwtGenerator.generateToken({
      userId,
      scope: ['read', 'write'],
      mfa_verified: payload.mfa_verified || false
    }, 'access');

    console.log(` Token renovado para ${userId}`);

    return {
      success: true,
      newAccessToken
    };
  }

  /**
   * Invalida sessão
   */
  public invalidateSession(sessionId: string): boolean {
    return this.sessionManager.invalidateSession(sessionId);
  }

  /**
   * Invalida todas as sessões de um usuário
   */
  public invalidateUserSessions(userId: string): number {
    return this.sessionManager.invalidateUserSessions(userId);
  }

  /**
   * Obtém todas as sessões (getter público)
   */
  public getAllSessions(): SecuritySession[] {
    return this.sessionManager.getAllSessions();
  }

  /**
   * Obtém dados de força bruta (getter público)
   */
  public getBruteForceData(): BruteForceProtection[] {
    return this.sessionManager.getBruteForceData();
  }

  /**
   * Obtém estatísticas de segurança
   */
  public getSecurityStats(): {
    activeSessions: number;
    totalSessions: number;
    highRiskSessions: number;
    lockedAccounts: number;
    mfaSuccessRate: number;
    averageSessionDuration: number;
  } {
    // Obter dados através de métodos públicos ou criar getters
    const sessions = this.getAllSessions();
    const bruteForceData = this.getBruteForceData();

    const activeSessions = sessions.filter((s: SecuritySession) => s.isActive).length;
    const highRiskSessions = sessions.filter((s: SecuritySession) => s.riskScore > 70).length;
    const lockedAccounts = bruteForceData.filter((b: BruteForceProtection) => b.isLocked).length;

    // Calcular taxa de sucesso MFA (simulação)
    const mfaSuccessRate = 0.95; // 95% - simulação

    // Calcular duração média da sessão
    const sessionDurations = sessions
      .filter((s: SecuritySession) => !s.isActive && s.expiresAt && s.createdAt)
      .map((s: SecuritySession) => (s.expiresAt.getTime() - s.createdAt.getTime()) / 1000 / 60); // minutos

    const averageSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
      : 0;

    return {
      activeSessions,
      totalSessions: sessions.length,
      highRiskSessions,
      lockedAccounts,
      mfaSuccessRate,
      averageSessionDuration
    };
  }
}

// Exportar instância singleton
export const mfaJWTSystem = new MFAJWTSystem();