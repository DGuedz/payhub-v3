const { requireAuth } = require('../../_auth');
const { logger } = require('../../_logger');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    const q = req.query || {};
    const periodStart = q.periodStart || null;
    const periodEnd = q.periodEnd || null;
    const currency = (q.currency || 'RLUSD').toUpperCase();
    const granularity = q.granularity || 'daily';
    const merchantId = q.merchantId || 'MERCHANT-DEFAULT';
    const kpis = {
      totalProcessed: 128940,
      totalSettled: 127100,
      totalPending: 1840,
      avgSettlementSeconds: 3,
      costSavingsPct: 0.52,
    };
    const breakdown = [
      { date: '2025-11-10', value: 31200 },
      { date: '2025-11-11', value: 29500 },
      { date: '2025-11-12', value: 28340 },
      { date: '2025-11-13', value: 40000 },
    ];
    try {
      logger.audit('[P4YHU3-REPORT] Finance Overview', { merchantId, currency, granularity });
    } catch {}
    return res.status(200).json({ ok: true, filters: { periodStart, periodEnd, currency, granularity, merchantId }, kpis, breakdown });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
};