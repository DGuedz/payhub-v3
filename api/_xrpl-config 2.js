// Seleção de rede XRPL com fallback por XRPL_WS_URL
// Suporta: devnet, testnet, mainnet

const NETWORK_URLS = {
  devnet: 'wss://s.devnet.rippletest.net:51233',
  testnet: 'wss://s.altnet.rippletest.net:51233',
  mainnet: 'wss://xrplcluster.com',
};

function getWsUrl() {
  const override = process.env.XRPL_WS_URL;
  if (override && typeof override === 'string' && override.trim().length > 0) {
    return override.trim();
  }
  const network = (process.env.XRPL_NETWORK || 'devnet').toLowerCase();
  return NETWORK_URLS[network] || NETWORK_URLS.devnet;
}

module.exports = { getWsUrl };