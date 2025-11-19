import type { NextRequest } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const auth = req.headers.get('authorization') || '';
    const res = await fetch(`${API_BASE_URL}/api/amm/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body || {}),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: data?.error || res.statusText }), { status: res.status });
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
