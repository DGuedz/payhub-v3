const { requireAuth } = require('./_auth');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  return res.status(501).json({ ok: false, error: 'NOT_IMPLEMENTED_LOCAL_STUB' });
};

