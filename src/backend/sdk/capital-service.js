const crypto = require('crypto');

function solicitarFinanciamento(rcvId, amount) {
  const fundingId = 'FUND-' + crypto.randomUUID();
  return { ok: true, fundingId, asset: 'RLUSD', value: String(amount), rcvId };
}

function cancelarFinanciamento(fundingId) {
  return { ok: true, fundingId };
}

module.exports = { solicitarFinanciamento, cancelarFinanciamento };

