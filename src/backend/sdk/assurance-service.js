const crypto = require('crypto');

function criarEscrow(funding, destination, condition) {
  const signedTxBlob = '0x' + crypto.randomBytes(64).toString('hex');
  const owner = destination;
  return { ok: true, signedTxBlob, owner };
}

function submeterTransacao(signedTxBlob) {
  const txHash = crypto.createHash('sha256').update(signedTxBlob).digest('hex').toUpperCase();
  const offerSequence = Math.floor(100000 + Math.random() * 900000);
  return { ok: true, txHash, offerSequence };
}

module.exports = { criarEscrow, submeterTransacao };

