// Logger unificado (JS) para rotas serverless
const SENSITIVE_KEYS = ['xrpl_seed', 'authorization', 'jwt', 'token', 'secret'];

function redact(value) {
  if (typeof value === 'string') {
    if (value.length > 8) return `${value.slice(0, 4)}...redacted`;
    return 'redacted';
  }
  if (typeof value === 'object' && value !== null) {
    const safe = {};
    Object.keys(value).forEach((key) => {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        safe[key] = 'redacted';
      } else {
        safe[key] = value[key];
      }
    });
    return safe;
  }
  return value;
}

function baseLog(level, message, context) {
  const timestamp = new Date().toISOString();
  const entry = {
    ts: timestamp,
    level,
    msg: message,
    ...(context ? { ctx: redact(context) } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'warn') console.warn(line);
  else if (level === 'error') console.error(line);
  else console.log(line);
}

exports.logger = {
  info: (msg, ctx) => baseLog('info', msg, ctx),
  warn: (msg, ctx) => baseLog('warn', msg, ctx),
  error: (msg, ctx) => baseLog('error', msg, ctx),
  audit: (msg, ctx) => baseLog('audit', msg, ctx),
  logTxAudit: (txHash, sequence, extra) => baseLog('audit', 'XRPL Transaction', { txHash, sequence, ...(extra || {}) }),
};