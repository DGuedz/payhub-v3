// Adapter KMS conceitual para obter XRPL_SEED de forma segura
// Produção: usar AWS KMS / Vault para descriptografar a seed
// Desenvolvimento: obtém XRPL_SEED via variável de ambiente, sem logs

async function getDecryptedXRPLSeed() {
  try {
    const seed = process.env.XRPL_SEED;
    if (!seed) {
      throw new Error('Missing XRPL_SEED env');
    }
    return seed;
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    throw new Error(`KMS adapter error: ${msg}`);
  }
}

module.exports = { getDecryptedXRPLSeed };