module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  try {
    const owner = req.query && req.query.owner ? String(req.query.owner) : '';
    if (!owner) return res.status(400).json({ ok: false, error: 'Missing owner' });
    return res.status(200).json({ ok: true, owner });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return res.status(500).json({ ok: false, error: message });
  }
};

