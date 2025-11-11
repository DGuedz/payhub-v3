import type { NextRequest } from 'next/server';

// Proxy para finalizar Escrow via backend Node
const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const { owner, offerSequence } = await req.json();
    const auth = req.headers.get('authorization') || '';

    if (!owner || typeof offerSequence !== 'number') {
      return new Response(JSON.stringify({ ok: false, error: 'Missing owner or offerSequence' }), { status: 400 });
    }

    const finishRes = await fetch(`${API_BASE_URL}/api/escrow-finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify({ owner, offerSequence }),
    });

    const data = await safeJson(finishRes);
    if (!finishRes.ok) {
      return new Response(JSON.stringify({ ok: false, error: data?.error || finishRes.statusText }), { status: finishRes.status });
    }
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const message = err?.message || String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 });
  }
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}