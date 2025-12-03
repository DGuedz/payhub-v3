// Compliance Screening Stub — institutional-grade placeholder
// Never log PII or secrets; keep decision minimal and auditable

async function screenPayment(input) {
  const { type, currency, value, owner } = input || {};
  // Simple policy: allow small values; block absurdly large to simulate thresholds
  const numeric = Number(value || 0);
  if (Number.isFinite(numeric) && numeric > 1000000) {
    return { allowed: false, reason: 'LIMIT_EXCEEDED' };
  }
  return { allowed: true };
}

module.exports = { screenPayment };

