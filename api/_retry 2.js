// Retry/backoff controlado para operações assíncronas

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, { retries = 3, baseMs = 400, onError } = {}) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      if (typeof onError === 'function') {
        try { onError(err, attempt); } catch {}
      }
      // Erros que valem retry: 429 Too Many Requests, ECONNRESET, ETIMEDOUT
      const retryable = /429|ECONNRESET|ETIMEDOUT|timeout/i.test(message);
      if (!retryable || attempt === retries) throw err;
      const delay = baseMs * Math.pow(2, attempt);
      await sleep(delay);
      attempt += 1;
    }
  }
}

module.exports = { withRetry };