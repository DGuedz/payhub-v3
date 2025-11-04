module.exports = (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
};
