async function screenPayment(payload) {
  const blockedCurrencies = (process.env.SCREEN_BLOCKED_CURRENCIES || '').split(',').map(s => s.trim()).filter(Boolean);
  const maxAmount = Number(process.env.SCREEN_MAX_AMOUNT || '1000000');
  const blockedOwners = (process.env.SCREEN_BLOCKED_OWNERS || '').split(',').map(s => s.trim()).filter(Boolean);
  const currency = payload && payload.currency ? String(payload.currency).toUpperCase() : null;
  const value = payload && payload.value ? Number(payload.value) : null;
  const owner = payload && payload.owner ? String(payload.owner) : null;
  if (currency && blockedCurrencies.includes(currency)) {
    return { allowed: false, reason: 'CURRENCY_BLOCKED' };
  }
  if (value !== null && Number.isFinite(value) && value > maxAmount) {
    return { allowed: false, reason: 'AMOUNT_EXCEEDS_POLICY' };
  }
  if (owner && blockedOwners.includes(owner)) {
    return { allowed: false, reason: 'OWNER_BLOCKED' };
  }
  return { allowed: true };
}

module.exports = { screenPayment };