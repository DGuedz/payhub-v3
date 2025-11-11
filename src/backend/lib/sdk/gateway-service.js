// GatewayService: abstrai entrada do frontend (PIX, cartão, cripto)
// Stub inicial: não faz chamada externa, valida e normaliza payload
const { logger } = require('../../../../api/_logger');

class GatewayService {
  static async validarEntrada(payload) {
    try {
      const { valor_brl, parcelas, recebedor_wallet, prova_servico_id } = payload || {};
      if (typeof valor_brl !== 'number' || valor_brl <= 0) throw new Error('valor_brl inválido');
      if (typeof parcelas !== 'number' || parcelas <= 0) throw new Error('parcelas inválidas');
      if (!recebedor_wallet || typeof recebedor_wallet !== 'string') throw new Error('recebedor_wallet inválido');
      if (!prova_servico_id || typeof prova_servico_id !== 'string') throw new Error('prova_servico_id inválido');
      logger.info('[P4YHU3-SDK] GatewayService validarEntrada OK', { valor_brl, parcelas, recebedor_wallet });
      return { valor_brl, parcelas, recebedor_wallet, prova_servico_id };
    } catch (err) {
      logger.error('[P4YHU3-SDK] GatewayService validarEntrada FAIL', { error: err.message });
      throw err;
    }
  }
}

module.exports = { GatewayService };