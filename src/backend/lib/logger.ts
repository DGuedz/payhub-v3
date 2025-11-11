/**
 * Logger unificado PAYHUB_V3
 * - Redação segura de campos sensíveis
 * - Níveis: info, warn, error, audit
 * - Auditoria de transações XRPL: txHash e sequence
 */

type LogLevel = 'info' | 'warn' | 'error' | 'audit';

const SENSITIVE_KEYS = ['xrpl_seed', 'authorization', 'jwt', 'token', 'secret'];

function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length > 8) return `${value.slice(0, 4)}...redacted`;
    return 'redacted';
  }
  if (typeof value === 'object' && value !== null) {
    const obj: Record<string, any> = value as Record<string, any>;
    const safe: Record<string, any> = {};
    Object.keys(obj).forEach((key) => {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        safe[key] = 'redacted';
      } else {
        safe[key] = obj[key];
      }
    });
    return safe;
  }
  return value;
}

function baseLog(level: LogLevel, message: string, context?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const entry = {
    ts: timestamp,
    level,
    msg: message,
    ...(context ? { ctx: redact(context) } : {}),
  };
  // Centralizar logs (futuro: enviar para provedor)
  // Mantemos console.* apenas dentro do logger unificado
  switch (level) {
    case 'info':
      console.log(JSON.stringify(entry));
      break;
    case 'warn':
      console.warn(JSON.stringify(entry));
      break;
    case 'error':
      console.error(JSON.stringify(entry));
      break;
    case 'audit':
      console.log(JSON.stringify(entry));
      break;
  }
}

export const logger = {
  info: (message: string, context?: Record<string, any>) => baseLog('info', message, context),
  warn: (message: string, context?: Record<string, any>) => baseLog('warn', message, context),
  error: (message: string, context?: Record<string, any>) => baseLog('error', message, context),
  audit: (message: string, context?: Record<string, any>) => baseLog('audit', message, context),
  logTxAudit: (txHash: string, sequence: number, extra?: Record<string, any>) => {
    baseLog('audit', 'XRPL Transaction', { txHash, sequence, ...(extra || {}) });
  },
};

export default logger;