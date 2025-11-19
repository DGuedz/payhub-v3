const { logger } = require('../../../api/_logger');

function logarOperacao(txHash, merchantId, status) {
  const operationId = 'OP-' + Date.now();
  try { logger.audit('SDK Reporting', { txHash, merchantId, status, operationId }); } catch {}
  return { ok: true, operationId };
}

module.exports = { logarOperacao };

