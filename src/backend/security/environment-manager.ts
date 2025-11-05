/**
 * Gerenciador Seguro de Variáveis de Ambiente
 * Centraliza e valida todas as variáveis de ambiente do sistema
 */

interface EnvironmentValidation {
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'url' | 'jwt' | 'api_key';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  defaultValue?: any;
}

interface EnvironmentConfig {
  [key: string]: EnvironmentValidation;
}

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;
  private envCache: Map<string, any>;
  private validationErrors: string[];

  private constructor() {
    this.config = this.getDefaultConfig();
    this.envCache = new Map();
    this.validationErrors = [];
    this.validateAll();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Configuração padrão das variáveis de ambiente requeridas
   */
  private getDefaultConfig(): EnvironmentConfig {
    return {
      // JWT Configuration
      JWT_SECRET: {
        required: true,
        type: 'string',
        minLength: 32,
        pattern: /^[a-zA-Z0-9-_]+$/
      },
      
      JWT_TOKEN: {
        required: false,
        type: 'jwt',
        minLength: 100
      },

      JWT_REFRESH_SECRET: {
        required: false,
        type: 'string',
        minLength: 32
      },

      // API Keys
      FIGMA_TOKEN: {
        required: false,
        type: 'api_key',
        minLength: 30
      },

      FIGMA_FILE_KEY: {
        required: false,
        type: 'string',
        minLength: 20
      },

      VERCEL_TOKEN: {
        required: false,
        type: 'api_key',
        minLength: 40
      },

      OPENAI_API_KEY: {
        required: false,
        type: 'api_key',
        minLength: 40
      },

      // Database
      DATABASE_URL: {
        required: false,
        type: 'url',
        pattern: /^postgresql:\/\//
      },

      SUPABASE_URL: {
        required: false,
        type: 'url'
      },

      SUPABASE_ANON_KEY: {
        required: false,
        type: 'string',
        minLength: 40
      },

      // App Configuration
      NODE_ENV: {
        required: true,
        type: 'string',
        defaultValue: 'development',
        pattern: /^(development|production|test)$/
      },

      PORT: {
        required: false,
        type: 'number',
        defaultValue: 3000
      },

      // Security
      TOKEN_ROTATION_INTERVAL: {
        required: false,
        type: 'number',
        defaultValue: 86400000 // 24 horas
      },

      AUTO_ROTATION_ENABLED: {
        required: false,
        type: 'boolean',
        defaultValue: true
      },

      LOG_RETENTION_DAYS: {
        required: false,
        type: 'number',
        defaultValue: 30
      }
    };
  }

  /**
   * Valida todas as variáveis de ambiente
   */
  private validateAll(): void {
    this.validationErrors = [];

    for (const [key, validation] of Object.entries(this.config)) {
      try {
        this.get(key); // Tenta obter e valida automaticamente
      } catch (error) {
        this.validationErrors.push(`Falha na validacao de ${key}: ${error.message}`);
      }
    }

    if (this.validationErrors.length > 0) {
      console.warn('Aviso: Foram encontrados erros de validacao nas variaveis de ambiente:');
      this.validationErrors.forEach(error => console.warn(`  - ${error}`));
    }
  }

  /**
   * Obtém variável de ambiente com validação
   */
  public get(key: string): any {
    if (this.envCache.has(key)) {
      return this.envCache.get(key);
    }

    const validation = this.config[key];
    if (!validation) {
      throw new Error(`Variavel de ambiente nao configurada: ${key}`);
    }

    let value: any;

    // Tenta obter do ambiente (Node.js/Deno/Browser)
    if (typeof process !== 'undefined' && process.env) {
      value = process.env[key];
    } else if (typeof Deno !== 'undefined') {
      value = Deno.env.get(key);
    } else if (typeof window !== 'undefined') {
      // Para ambiente browser, pode ser injetado via script
      value = (window as any).__ENV__?.[key];
    }

    // Usa valor padrão se não encontrado
    if (value === undefined || value === '') {
      if (validation.required) {
        throw new Error(`Variavel de ambiente obrigatoria nao encontrada: ${key}`);
      }
      value = validation.defaultValue;
    }

    // Aplica validação baseada no tipo
    value = this.validateValue(key, value, validation);

    // Cache do valor validado
    this.envCache.set(key, value);
    return value;
  }

  /**
   * Valida valor baseado na configuração
   */
  private validateValue(key: string, value: any, validation: EnvironmentValidation): any {
    switch (validation.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`${key} deve ser uma string`);
        }
        if (validation.minLength && value.length < validation.minLength) {
          throw new Error(`${key} deve ter pelo menos ${validation.minLength} caracteres`);
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          throw new Error(`${key} deve ter no maximo ${validation.maxLength} caracteres`);
        }
        if (validation.pattern && !validation.pattern.test(value)) {
          throw new Error(`${key} possui formato invalido`);
        }
        return value;

      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          throw new Error(`${key} deve ser um numero valido`);
        }
        return numValue;

      case 'boolean':
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return Boolean(value);

      case 'url':
        if (typeof value !== 'string') {
          throw new Error(`${key} deve ser uma URL valida`);
        }
        try {
          new URL(value);
          return value;
        } catch {
          throw new Error(`${key} nao e uma URL valida`);
        }

      case 'jwt':
        if (typeof value !== 'string') {
          throw new Error(`${key} deve ser um token JWT valido`);
        }
        // Validação básica de JWT (3 partes separadas por ponto)
        const parts = value.split('.');
        if (parts.length !== 3) {
          throw new Error(`${key} nao possui formato JWT valido`);
        }
        return value;

      case 'api_key':
        if (typeof value !== 'string') {
          throw new Error(`${key} deve ser uma chave de API valida`);
        }
        if (validation.minLength && value.length < validation.minLength) {
          throw new Error(`${key} deve ter pelo menos ${validation.minLength} caracteres`);
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * Verifica se todas as variáveis requeridas estão presentes
   */
  public isValid(): boolean {
    return this.validationErrors.length === 0;
  }

  /**
   * Obtém erros de validação
   */
  public getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Limpa cache (útil para testes ou recarregamento)
   */
  public clearCache(): void {
    this.envCache.clear();
    this.validateAll();
  }

  /**
   * Obtém todas as variáveis de ambiente (sem valores sensíveis)
   */
  public getAllSafe(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const key of Object.keys(this.config)) {
      try {
        const value = this.get(key);
        // Oculta valores sensíveis
        if (this.isSensitiveKey(key)) {
          result[key] = '***' + value.toString().substring(value.length - 4);
        } else {
          result[key] = value;
        }
      } catch {
        // Ignora variáveis não disponíveis
      }
    }
    
    return result;
  }

  /**
   * Verifica se a chave contém informação sensível
   */
  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      /SECRET/i,
      /TOKEN/i,
      /KEY/i,
      /PASSWORD/i,
      /CREDENTIAL/i,
      /PRIVATE/i,
      /ACCESS/i,
      /AUTH/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  /**
   * Adiciona configuração personalizada
   */
  public addConfig(key: string, validation: EnvironmentValidation): void {
    this.config[key] = validation;
    this.envCache.delete(key); // Remove do cache para forçar revalidação
    this.validateAll();
  }
}

// Export singleton instance
export const env = EnvironmentManager.getInstance();

// Helper functions para acesso rápido
export function getEnv(key: string): any {
  return env.get(key);
}

export function requireEnv(key: string): any {
  const value = env.get(key);
  if (value === undefined || value === null) {
    throw new Error(`Variavel de ambiente obrigatoria: ${key}`);
  }
  return value;
}

export function isProduction(): boolean {
  return env.get('NODE_ENV') === 'production';
}

export function isDevelopment(): boolean {
  return env.get('NODE_ENV') === 'development';
}

export function isTest(): boolean {
  return env.get('NODE_ENV') === 'test';
}