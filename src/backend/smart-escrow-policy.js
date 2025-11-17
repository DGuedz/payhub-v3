async function verifyKycAllowed(screenPayment, subject) {
  const res = await screenPayment({ type: 'KYC_CHECK', owner: subject });
  return !!res && !!res.allowed;
}

async function verifyNftOwnership(xrpl, client, account, nftId) {
  const r = await client.request({ command: 'account_nfts', account, ledger_index: 'validated' });
  const list = r && r.result && Array.isArray(r.result.account_nfts) ? r.result.account_nfts : [];
  return list.some((n) => String(n.NFTokenID).toUpperCase() === String(nftId).toUpperCase());
}

async function enforcePolicy(policy, context) {
  const { xrpl, client, screenPayment } = context;
  if (!policy) return true;
  if (policy.requireKyc) {
    const ok = await verifyKycAllowed(screenPayment, policy.subject || policy.destination);
    if (!ok) return false;
  }
  if (policy.nftId && policy.destination) {
    const ok = await verifyNftOwnership(xrpl, client, policy.destination, policy.nftId);
    if (!ok) return false;
  }
  return true;
}

module.exports = { enforcePolicy };

