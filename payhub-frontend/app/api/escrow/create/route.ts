import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  const auth = req.headers.get('authorization') || '';
  let body: any = {};
  try { body = await req.json(); } catch {}
  const value = String(body?.value || '');
  try {
    const res = await fetch(`${API_BASE_URL}/api/escrow-create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
      body: JSON.stringify({ value }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) return NextResponse.json(data);
    const err = String(data?.error || res.statusText || 'Unknown');
    logger.warn('EscrowCreate backend falhou, ativando fallback de simulação', { err });
    const simRes = await fetch(`${API_BASE_URL}/api/simulate/escrow-e2e`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
      body: JSON.stringify({ value }),
    });
    const simJson = await simRes.json().catch(() => null);
    if (!simRes.ok) return NextResponse.json({ ok: false, error: simJson?.error || 'Simulação indisponível' }, { status: 500 });
    const art = simJson?.artifacts || {};
    const offerSequence = Number(art?.escrowCreate?.offerSequence || Math.floor(100000 + Math.random() * 900000));
    const txHash = String(art?.escrowCreate?.txHash || `ESC${Date.now()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    const owner = String(art?.escrowCreate?.owner || 'rOwnerSim');
    return NextResponse.json({ ok: true, message: 'Escrow criado (simulado)', offerSequence, txHash, amount: { currency: 'RLUSD', value, issuer: process.env.NEXT_PUBLIC_RLUSD_ISSUER || '' }, status: 'created', owner, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Erro fatal no proxy de EscrowCreate', error as any);
    return NextResponse.json({ ok: false, error: 'Erro interno ao criar escrow' }, { status: 500 });
  }
}
