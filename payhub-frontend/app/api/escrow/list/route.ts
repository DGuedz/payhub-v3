import type { NextRequest } from 'next/server';

// Lista escrows pendentes via XRPL RPC (somente leitura)
// Não requer assinatura; usa owner address público configurado via env

const NETWORKS: Record<string, string> = {
  devnet: 'https://s.devnet.rippletest.net:51234/',
  testnet: 'https://s.altnet.rippletest.net:51234/',
  mainnet: 'https://xrplcluster.com', // HTTP JSON-RPC não é público em cluster; ajustar se necessário
};

function getRpcUrl() {
  const override = process.env.XRPL_RPC_URL || process.env.NEXT_PUBLIC_XRPL_RPC_URL;
  if (override) return override;
  const net = (process.env.XRPL_NETWORK || process.env.NEXT_PUBLIC_XRPL_NETWORK || 'devnet').toLowerCase();
  return NETWORKS[net] || NETWORKS.devnet;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const owner = process.env.ESCROW_OWNER_ADDRESS || process.env.NEXT_PUBLIC_ESCROW_OWNER_ADDRESS || url.searchParams.get('owner') || '';
    if (!owner) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing ESCROW_OWNER_ADDRESS' }), { status: 400 });
    }

    const rpcUrl = getRpcUrl();
    const payload = {
      method: 'account_objects',
      params: [{ account: owner, type: 'escrow', limit: 50 }],
    };

    const resRpc = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resRpc.json();
    const objects = data?.result?.account_objects || [];

    const escrows = objects.map((obj: any) => {
      const amountObj = obj.Amount;
      const isIou = typeof amountObj === 'object' && amountObj !== null;
      const amount = isIou ? amountObj.value : amountObj;
      const currency = isIou ? amountObj.currency : 'XRP';
      return {
        id: `${obj.Owner}:${obj.OfferSequence}`,
        owner: obj.Owner,
        offerSequence: obj.OfferSequence,
        amount: String(amount),
        currency: String(currency),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    });

    return new Response(JSON.stringify({ ok: true, escrows }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const message = err?.message || String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 });
  }
}