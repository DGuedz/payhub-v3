// AssuranceService: custódia/assinatura (Metaco) e submissão (Rails/XRPL)
// Mock: lê blobs e tx_hash de mocks
const fs = require('fs');
const path = require('path');
const { logger } = require('../../../../api/_logger');

function readMock(name) {
  const p = path.join(process.cwd(), 'mocks', name);
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

class AssuranceService {
  static async criarEscrow(funding, destination, condition) {
    try {
      const mock = readMock('metaco-sign.json');
      const signedTxBlob = mock.signed_tx_blob || 'BLOB_ASSINADO_MOCK';
      logger.info('[P4YHU3-SDK] Passo 2: Assinatura Metaco... OK', { destination, condition });
      return signedTxBlob;
    } catch (err) {
      logger.error('[P4YHU3-SDK] Passo 2: Assinatura Metaco... FAIL', { error: err.message });
      throw err;
    }
  }

  static async submeterTransacao(signedTxBlob) {
    try {
      const mock = readMock('rails-submit.json');
      const txHash = mock.tx_hash || `TX-${Date.now()}`;
      logger.audit('[P4YHU3-SDK] Passo 3: Submissão XRPL (Rails)... OK', { txHash });
      return { status: 'success', txHash };
    } catch (err) {
      logger.error('[P4YHU3-SDK] Passo 3: Submissão XRPL (Rails)... FAIL', { error: err.message });
      throw err;
    }
  }
}

module.exports = { AssuranceService };