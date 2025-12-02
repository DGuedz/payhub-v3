module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  try {
    const redirect = req.query && req.query.redirect ? String(req.query.redirect) : '';
    const url = 'https://xumm.app/dapp';
    return res.status(200).json({ ok: true, url, redirect });
  } catch (e) {
    const message = e && e.message ? e.message : String(e);
    return res.status(500).json({ ok: false, error: message });
  }
};

