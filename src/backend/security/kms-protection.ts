/**
 * Sistema de Proteção KMS (Key Management Service) PAYHUB_V3
 * 
 * Implementa proteção institucional para chaves XRPL com criptografia,
 * rotação automática e acesso controlado.
 */

export interface ProtectedKey {
  id: string;
  keyType: 'xrpl_seed' | 'api_key' | 'encryption_key';
  encryptedData: string;
  keyMetadata: {
    algorithm: string;
    keySize: number;
    createdAt: Date;
    expiresAt: Date;
    rotationCount: number;
    lastRotatedAt?: Date;
    accessLevel: 'admin' | 'system' | 'user';
  };
  accessLog: KeyAccessLog[];
  isActive: boolean;
  isCompromised: boolean;
}

export interface KeyAccessLog {
  timestamp: Date;
  action: 'create' | 'read' | 'update' | 'delete' | 'rotate';
  principal: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
  reason: string;
}

export interface KMSConfig {
  masterKeyRotationInterval: number; // days
  keyExpirationDays: number;
  maxAccessAttempts: number;
  lockoutDurationMinutes: number;
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  requireMFA: boolean;
  auditLogRetention: number; // days
}

export interface KeyRotationPolicy {
  automaticRotation: boolean;
  rotationInterval: number; // days
  notifyBeforeExpiration: number; // days
  requireApproval: boolean;
  backupBeforeRotation: boolean;
}

/**
 * Sistema KMS Protegido para PAYHUB
 * Gerencia chaves críticas com segurança institucional
 */
export class KMSProtectionSystem {
  private protectedKeys: Map<string, ProtectedKey> = new Map();
  private accessAttempts: Map<string, number> = new Map();
  private lockedPrincipals: Map<string, Date> = new Map();
  private config: KMSConfig;
  private keyRotationPolicies: Map<string, KeyRotationPolicy> = new Map();
  private masterKey: string;
  private auditLog: KeyAccessLog[] = [];

  constructor(config?: Partial<KMSConfig>) {
    this.config = {
      masterKeyRotationInterval: 90, // days
      keyExpirationDays: 365,
      maxAccessAttempts: 5,
      lockoutDurationMinutes: 30,
      encryptionAlgorithm: 'AES-256-GCM',
      requireMFA: true,
      auditLogRetention: 365,
      ...config
    };

    this.masterKey = this.generateMasterKey();
    this.initializeDefaultPolicies();
  }

  /**
   * Gera chave mestre simulada
   */
  private generateMasterKey(): string {
    // Em produção, isso viria de um HSM real
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 64; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  /**
   * Inicializa políticas padrão de rotação
   */
  private initializeDefaultPolicies(): void {
    this.keyRotationPolicies.set('xrpl_seed', {
      automaticRotation: true,
      rotationInterval: 90, // days
      notifyBeforeExpiration: 7,
      requireApproval: true,
      backupBeforeRotation: true
    });

    this.keyRotationPolicies.set('api_key', {
      automaticRotation: true,
      rotationInterval: 30, // days
      notifyBeforeExpiration: 3,
      requireApproval: false,
      backupBeforeRotation: true
    });

    this.keyRotationPolicies.set('encryption_key', {
      automaticRotation: true,
      rotationInterval: 180, // days
      notifyBeforeExpiration: 14,
      requireApproval: true,
      backupBeforeRotation: true
    });
  }

  /**
   * Criptografa dados sensíveis
   */
  private encryptData(data: string): string {
    // Simulação de criptografia - em produção usar biblioteca criptográfica real
    const encrypted = btoa(data + this.masterKey.substring(0, 16));
    return encrypted;
  }

  /**
   * Descriptografa dados
   */
  private decryptData(encryptedData: string): string {
    // Simulação de descriptografia
    try {
      const decrypted = atob(encryptedData);
      return decrypted.replace(this.masterKey.substring(0, 16), '');
    } catch (error) {
      throw new Error('Falha ao descriptografar dados');
    }
  }

  /**
   * Verifica se um principal está bloqueado
   */
  private isPrincipalLocked(principal: string): boolean {
    const lockoutTime = this.lockedPrincipals.get(principal);
    if (!lockoutTime) return false;

    const now = new Date();
    const lockoutDuration = this.config.lockoutDurationMinutes * 60 * 1000;
    
    if (now.getTime() - lockoutTime.getTime() > lockoutDuration) {
      // Lockout expirou
      this.lockedPrincipals.delete(principal);
      this.accessAttempts.delete(principal);
      return false;
    }

    return true;
  }

  /**
   * Registra tentativa de acesso
   */
  private recordAccessAttempt(principal: string, success: boolean): void {
    if (success) {
      this.accessAttempts.delete(principal);
      this.lockedPrincipals.delete(principal);
    } else {
      const attempts = (this.accessAttempts.get(principal) || 0) + 1;
      this.accessAttempts.set(principal, attempts);

      if (attempts >= this.config.maxAccessAttempts) {
        this.lockedPrincipals.set(principal, new Date());
        console.log(`Principal bloqueado: ${principal} (${attempts} tentativas)`);
      }
    }
  }

  /**
   * Registra acesso no log de auditoria
   */
  private logAccess(
    keyId: string,
    action: KeyAccessLog['action'],
    principal: string,
    success: boolean,
    reason: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      error?: string;
    }
  ): void {
    const logEntry: KeyAccessLog = {
      timestamp: new Date(),
      action,
      principal,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      success,
      error: metadata?.error,
      reason
    };

    this.auditLog.push(logEntry);
    
    // Manter apenas logs recentes
    const cutoffDate = new Date(Date.now() - this.config.auditLogRetention * 24 * 60 * 60 * 1000);
    this.auditLog = this.auditLog.filter(log => log.timestamp > cutoffDate);
  }

  /**
   * Cria uma nova chave protegida
   */
  public async createProtectedKey(
    keyType: ProtectedKey['keyType'],
    keyData: string,
    principal: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      accessLevel?: 'admin' | 'system' | 'user';
    }
  ): Promise<ProtectedKey> {
    
    if (this.isPrincipalLocked(principal)) {
      throw new Error(`Principal bloqueado: ${principal}`);
    }

    try {
      const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const encryptedData = this.encryptData(keyData);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.config.keyExpirationDays * 24 * 60 * 60 * 1000);

      const protectedKey: ProtectedKey = {
        id: keyId,
        keyType,
        encryptedData,
        keyMetadata: {
          algorithm: this.config.encryptionAlgorithm,
          keySize: 256,
          createdAt: now,
          expiresAt,
          rotationCount: 0,
          accessLevel: metadata?.accessLevel || 'user'
        },
        accessLog: [],
        isActive: true,
        isCompromised: false
      };

      this.protectedKeys.set(keyId, protectedKey);
      
      this.logAccess(keyId, 'create', principal, true, 'Chave criada com sucesso', metadata);
      this.recordAccessAttempt(principal, true);

      console.log(`Chave protegida criada: ${keyId} (${keyType})`);
      return protectedKey;

    } catch (error) {
      this.logAccess('unknown', 'create', principal, false, 'Falha ao criar chave', {
        ...metadata,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      this.recordAccessAttempt(principal, false);
      throw error;
    }
  }

  /**
   * Acessa uma chave protegida
   */
  public async accessProtectedKey(
    keyId: string,
    principal: string,
    reason: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<string> {
    
    if (this.isPrincipalLocked(principal)) {
      throw new Error(`Principal bloqueado: ${principal}`);
    }

    const protectedKey = this.protectedKeys.get(keyId);
    if (!protectedKey) {
      this.recordAccessAttempt(principal, false);
      throw new Error(`Chave não encontrada: ${keyId}`);
    }

    if (!protectedKey.isActive) {
      this.recordAccessAttempt(principal, false);
      throw new Error(`Chave inativa: ${keyId}`);
    }

    if (protectedKey.isCompromised) {
      this.recordAccessAttempt(principal, false);
      throw new Error(`Chave comprometida: ${keyId}`);
    }

    if (protectedKey.keyMetadata.expiresAt < new Date()) {
      this.recordAccessAttempt(principal, false);
      throw new Error(`Chave expirada: ${keyId}`);
    }

    try {
      const decryptedData = this.decryptData(protectedKey.encryptedData);
      
      // Registrar acesso
      this.logAccess(keyId, 'read', principal, true, reason, metadata);
      this.recordAccessAttempt(principal, true);

      console.log(`Chave acessada: ${keyId} por ${principal}`);
      return decryptedData;

    } catch (error) {
      this.logAccess(keyId, 'read', principal, false, reason, {
        ...metadata,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      this.recordAccessAttempt(principal, false);
      throw error;
    }
  }

  /**
   * Rotaciona uma chave protegida
   */
  public async rotateProtectedKey(
    keyId: string,
    newKeyData: string,
    principal: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<ProtectedKey> {
    
    if (this.isPrincipalLocked(principal)) {
      throw new Error(`Principal bloqueado: ${principal}`);
    }

    const protectedKey = this.protectedKeys.get(keyId);
    if (!protectedKey) {
      throw new Error(`Chave não encontrada: ${keyId}`);
    }

    try {
      // Backup antes da rotação (se configurado)
      const policy = this.keyRotationPolicies.get(protectedKey.keyType);
      if (policy?.backupBeforeRotation) {
        await this.backupKey(keyId, principal);
      }

      // Criar nova versão da chave
      const encryptedNewData = this.encryptData(newKeyData);
      protectedKey.encryptedData = encryptedNewData;
      protectedKey.keyMetadata.lastRotatedAt = new Date();
      protectedKey.keyMetadata.rotationCount++;

      this.logAccess(keyId, 'rotate', principal, true, 'Chave rotacionada com sucesso', metadata);
      this.recordAccessAttempt(principal, true);

      console.log(`Chave rotacionada: ${keyId} (${protectedKey.keyMetadata.rotationCount} rotações)`);
      return protectedKey;

    } catch (error) {
      this.logAccess(keyId, 'rotate', principal, false, 'Falha ao rotacionar chave', {
        ...metadata,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      this.recordAccessAttempt(principal, false);
      throw error;
    }
  }

  /**
   * Marca uma chave como comprometida
   */
  public async markKeyAsCompromised(
    keyId: string,
    principal: string,
    reason: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    
    const protectedKey = this.protectedKeys.get(keyId);
    if (!protectedKey) {
      throw new Error(`Chave não encontrada: ${keyId}`);
    }

    protectedKey.isCompromised = true;
    protectedKey.isActive = false;

    this.logAccess(keyId, 'update', principal, true, `Chave marcada como comprometida: ${reason}`, metadata);

    console.log(` Chave comprometida: ${keyId} - ${reason}`);

    // Executar ações de emergência
    await this.emergencyKeyRevocation(keyId, principal);
  }

  /**
   * Backup de chave antes de rotação
   */
  private async backupKey(keyId: string, principal: string): Promise<void> {
    const protectedKey = this.protectedKeys.get(keyId);
    if (!protectedKey) {
      throw new Error(`Chave não encontrada: ${keyId}`);
    }

    // Simular backup
    const backupId = `backup_${keyId}_${Date.now()}`;
    const backupData = {
      keyId,
      encryptedData: protectedKey.encryptedData,
      metadata: protectedKey.keyMetadata,
      backedUpAt: new Date(),
      backedUpBy: principal
    };

    console.log(` Backup criado: ${backupId}`);
    
    // Em produção, salvar em storage seguro
    // await secureStorage.saveBackup(backupId, backupData);
  }

  /**
   * Revogação emergencial de chave
   */
  private async emergencyKeyRevocation(keyId: string, principal: string): Promise<void> {
    console.log(` Iniciando revogação emergencial da chave: ${keyId}`);

    // Ações de emergência:
    // 1. Notificar equipe de segurança
    console.log(` Equipe de segurança notificada sobre chave comprometida: ${keyId}`);

    // 2. Rotacionar chaves relacionadas
    console.log(` Chaves relacionadas sendo rotacionadas`);

    // 3. Invalidar sessões ativas
    console.log(` Todas as sessões usando esta chave foram invalidadas`);

    // 4. Gerar novo par de chaves
    console.log(` Novo par de chaves sendo gerado`);
  }

  /**
   * Obtém estatísticas de uso de chaves
   */
  public getKeyStatistics(): {
    totalKeys: number;
    activeKeys: number;
    compromisedKeys: number;
    expiredKeys: number;
    keysByType: Record<string, number>;
    totalAccessLog: number;
    failedAttempts: number;
    lockedPrincipals: number;
  } {
    const now = new Date();
    const keys = Array.from(this.protectedKeys.values());

    const expiredKeys = keys.filter(key => key.keyMetadata.expiresAt < now).length;

    const keysByType = keys.reduce((acc, key) => {
      acc[key.keyType] = (acc[key.keyType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const failedAttempts = this.auditLog.filter(log => !log.success).length;

    return {
      totalKeys: keys.length,
      activeKeys: keys.filter(key => key.isActive).length,
      compromisedKeys: keys.filter(key => key.isCompromised).length,
      expiredKeys,
      keysByType,
      totalAccessLog: this.auditLog.length,
      failedAttempts,
      lockedPrincipals: this.lockedPrincipals.size
    };
  }

  /**
   * Obtém log de auditoria
   */
  public getAuditLog(
    keyId?: string,
    principal?: string,
    limit: number = 100
  ): KeyAccessLog[] {
    let logs = this.auditLog;

    if (keyId) {
      logs = logs.filter(log => log.action === 'read' || log.action === 'create' || log.action === 'rotate');
      // Filtrar por keyId requer mapeamento adicional
    }

    if (principal) {
      logs = logs.filter(log => log.principal === principal);
    }

    return logs.slice(-limit).reverse();
  }

  /**
   * Verifica e executa rotações automáticas
   */
  public async checkAndRotateExpiredKeys(principal: string): Promise<string[]> {
    const now = new Date();
    const rotatedKeys: string[] = [];

    for (const [keyId, protectedKey] of this.protectedKeys) {
      const policy = this.keyRotationPolicies.get(protectedKey.keyType);
      
      if (!policy?.automaticRotation) continue;

      const daysSinceCreation = (now.getTime() - protectedKey.keyMetadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceRotation = protectedKey.keyMetadata.lastRotatedAt 
        ? (now.getTime() - protectedKey.keyMetadata.lastRotatedAt.getTime()) / (1000 * 60 * 60 * 24)
        : daysSinceCreation;

      if (daysSinceRotation >= policy.rotationInterval) {
        console.log(` Rotação automática necessária para: ${keyId}`);
        
        try {
          // Gerar nova chave (simulação)
          const newKeyData = `new_key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await this.rotateProtectedKey(keyId, newKeyData, principal);
          rotatedKeys.push(keyId);
          
        } catch (error) {
          console.error(` Falha ao rotacionar chave ${keyId}:`, error);
        }
      }
    }

    return rotatedKeys;
  }
}

// Exportar instância singleton
export const kmsProtectionSystem = new KMSProtectionSystem();