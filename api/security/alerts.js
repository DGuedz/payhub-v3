const { requireAuth } = require('../_auth');

function r(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function addr() { const c = 'r123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; let s = 'r'; const n = r(25, 30); for (let i = 0; i < n; i++) s += c[r(0, c.length - 1)]; return s; }
function alert(sev) { const wallet = addr(); const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`; return { id, type: 'honeypot_triggered', severity: sev, walletAddress: wallet, description: 'Atividade suspeita detectada em carteira isca', timestamp: new Date().toISOString(), metadata: { triggerEvent: { eventType: 'metadata_request', riskScore: r(10, 90) } }, actionsTaken: ['session_invalidated', 'event_logged'] }; }

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res); if (!authUser) return;
  const alerts = [alert('medium'), alert('high'), alert('critical')];
  const stats = { totalAlerts: alerts.length, alertsBySeverity: alerts.reduce((acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; }, {}) };
  return res.status(200).json({ ok: true, alerts, stats });
};