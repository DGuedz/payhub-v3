function activateYield(merchantId) {
  const activationId = 'YIELD-' + merchantId + '-' + Date.now();
  return { ok: true, activationId, status: 'PENDING_ACTIVATION' };
}

module.exports = { activateYield };

