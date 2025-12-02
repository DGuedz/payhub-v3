const { requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res); if (!authUser) return;
  try {
    const { method, amountBRL, installments } = req.body || {};
    const m = String(method || '').toLowerCase();
    const amount = Number(amountBRL);
    if (!['cartao_avista','parcelado','debito','pix'].includes(m)) return res.status(400).json({ ok: false, error: 'Invalid method' });
    if (!isFinite(amount) || amount <= 0) return res.status(400).json({ ok: false, error: 'Invalid amountBRL' });

    const rates = { cartao_avista: 0.025, parcelado: 0.035, debito: 0.0135, pix: 0.0 };
    const feeBRL = Number((amount * (rates[m] || 0)).toFixed(2));
    const netBRL = Number((amount - feeBRL).toFixed(2));
    const rlusdValue = Number((netBRL / 5.0).toFixed(2));

    let pix = undefined;
    if (m === 'pix') {
      const pixId = `PIX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const payload = JSON.stringify({ key: 'merchant@payhub', amountBRL: netBRL.toFixed(2), txid: pixId });
      let qrCodeBase64 = '';
      try { qrCodeBase64 = Buffer.from(payload, 'utf8').toString('base64'); } catch { qrCodeBase64 = payload; }
      pix = { pixId, qrCodeBase64 };
    }

    const flow = ['authorize', 'capture', 'convert_odl_rlusd', 'escrow_create_iou', 'escrow_finish'];
    const explanation = (
      'PAYHUB integra trilhos tradicionais (PIX e cartão) com liquidez sob demanda (ODL) na XRPL. '
      + 'Ao receber um pagamento, o HUB converte o valor BRL em RLUSD (Issued Currency), cria um Escrow na XRPL '
      + 'com Amount IOU e finaliza a liquidação D+0 via EscrowFinish. Para cartão à vista e débito, aplicamos taxas '
      + 'operacionais, geramos RLUSD e executamos Escrow. No parcelado, simulamos encargos e consolidamos o valor em RLUSD, '
      + 'preservando segurança: XRPL_SEED isolada via KMS, assinatura apenas no backend, JWT curto nas rotas críticas, '
      + 'auditoria por txHash/sequence e tolerância a falhas. O comerciante vê saldo RLUSD e pode ativar yield no XRPL EVM '
      + 'Sidechain (mXRP) com 5–8% APY sobre excedentes, mantendo conformidade e logs completos.'
    );

    return res.json({ ok: true, method: m, amountBRL: amount.toFixed(2), feeBRL: feeBRL.toFixed(2), netBRL: netBRL.toFixed(2), rlusdValue: rlusdValue.toFixed(2), installments: m==='parcelado' ? Number(installments || 2) : undefined, pix, flow, explanation });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return res.status(500).json({ ok: false, error: message });
  }
};
