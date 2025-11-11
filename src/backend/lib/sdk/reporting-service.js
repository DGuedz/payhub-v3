// ReportingService: registrar operação em tesouraria (GTreasury)
// Mock: lê resposta de mock e retorna id
const fs = require('fs');
const path = require('path');
const { logger } = require('../../../../api/_logger');

function readMock(name) {
  const p = path.join(process.cwd(), 'mocks', name);
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

class ReportingService {
  static async logarOperacao(txHash, merchantId, status) {
    try {
      const mock = readMock('gtreasury-log.json');
      const id = mock.operation_id || `PAYHUB-TX-${Date.now()}`;
      logger.info('[P4YHU3-SDK] Passo 4: Reporting GTreasury... OK', { txHash, merchantId, status, operationId: id });
      return { id };
    } catch (err) {
      logger.error('[P4YHU3-SDK] Passo 4: Reporting GTreasury... FAIL', { error: err.message });
      throw err;
    }
  }
}

module.exports = { ReportingService };