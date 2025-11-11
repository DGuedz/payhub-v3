import type { NextRequest } from 'next/server';

// Proxy de conversão ODL para o backend Node (server.js)
// Orquestra: Trustline RLUSD -> EscrowCreate
// Segurança: assinatura ocorre no backend; aqui apenas encaminhamos

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, paymentMethod, settlementType, merchantId } = body || {};
    const auth = req.headers.get('authorization') || '';

    if (!amount) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing amount' }), { status: 400 });
    }

    // 1) Trustline RLUSD (limit = amount)
    const trustlineRes = await fetch(`${API_BASE_URL}/api/trustline-rlusd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify({ limit: String(amount) }),
    });

    if (!trustlineRes.ok) {
      const err = await safeJson(trustlineRes);
      return new Response(JSON.stringify({ ok: false, step: 'trustline', error: err?.error || trustlineRes.statusText }), { status: trustlineRes.status });
    }
    const trustlineData = await trustlineRes.json();

    // 2) EscrowCreate (Amount RLUSD IOU = amount)
    const finishAfterUnix = settlementType === 'escrow' ? undefined : undefined; // pode ser ajustado conforme política
    const escrowRes = await fetch(`${API_BASE_URL}/api/escrow-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify({ value: String(amount), finishAfterUnix }),
    });

    if (!escrowRes.ok) {
      const err = await safeJson(escrowRes);
      return new Response(JSON.stringify({ ok: false, step: 'escrowCreate', error: err?.error || escrowRes.statusText }), { status: escrowRes.status });
    }
    const escrowData = await escrowRes.json();

    return new Response(JSON.stringify({ ok: true, trustline: trustlineData, escrowCreate: escrowData }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const message = err?.message || String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 });
  }
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}