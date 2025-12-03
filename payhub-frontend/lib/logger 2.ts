/**
 * Logger padronizado para o backend.
 * Evita o uso direto de console.log e permite futuras integrações 
 * com serviços de logging como Sentry, DataDog, etc.
 */

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

const log = (level: LogLevel, message: string, details: any = '') => {
  try {
    const logObject = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details: details ? (typeof details === 'object' ? JSON.parse(JSON.stringify(details, Object.getOwnPropertyNames(details))) : details) : undefined,
    };
    
    // Em ambiente de desenvolvimento, loga no console de forma legível.
    // Em produção, o ideal seria enviar para um serviço de logging.
    if (process.env.NODE_ENV === 'development') {
        console.log(JSON.stringify(logObject, null, 2));
    }

  } catch (error) {
    // Fallback para console.error se o próprio logger falhar.
    console.error('Falha no sistema de logging:', error);
    console.error('Log original:', { level, message, details });
  }
};

export const logger = {
  info: (message: string, details?: any) => log(LogLevel.INFO, message, details),
  warn: (message: string, details?: any) => log(LogLevel.WARN, message, details),
  error: (message: string, error: any) => {
    // Garante que objetos de erro sejam serializáveis
    const errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...error
    }
    log(LogLevel.ERROR, message, errorDetails);
  },
};