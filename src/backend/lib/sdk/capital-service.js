// CapitalService: orquestra financiamento colateralizado (Hidden Road)
// Mock: lê resposta de mocks e retorna fundingId
const fs = require('fs');
const path = require('path');
const { logger } = require('../../../../api/_logger');

function readMock(name) {
  const p = path.join(process.cwd(), 'mocks', name);
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

class CapitalService {
  static async solicitarFinanciamento(rcvId, amount) {
    try {
      const mock = readMock('hiddenroad-funding.json');
      const fundingId = mock.fundingId || `FUND-${Date.now()}`;
      logger.info('[P4YHU3-SDK] Passo 1: Financiamento Hidden Road... OK', { rcvId, amount, fundingId });
      return { ok: true, fundingId, asset: 'RLUSD', amount, destinationVault: mock.destinationVault || 'PAYHUB_TREASURY_ID' };
    } catch (err) {
      logger.error('[P4YHU3-SDK] Passo 1: Financiamento Hidden Road... FAIL', { error: err.message });
      throw err;
    }
  }

  static async cancelarFinanciamento(fundingId) {
    try {
      logger.warn('[P4YHU3-SDK] Rollback: cancelar financiamento', { fundingId });
      return { ok: true, canceled: true };
    } catch (err) {
      logger.error('[P4YHU3-SDK] Rollback: cancelar financiamento FAIL', { error: err.message });
      throw err;
    }
  }
}

module.exports = { CapitalService };