import { NextRequest, NextResponse } from 'next/server'

function base64FromText(text: string) {
  try { return Buffer.from(text, 'utf8').toString('base64') } catch { return btoa(text) }
}

async function verifyJwtJose(token: string | undefined) {
  try {
    if (!token) return false
    const secret = process.env.JWT_SECRET || ''
    if (!secret) return false
    const jose = await import('jose')
    const enc = new TextEncoder().encode(secret)
    await jose.jwtVerify(token, enc)
    return true
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.split(' ')[1]
    const ok = await verifyJwtJose(token)
    if (!ok) {
      return NextResponse.json({ error: '401 Unauthorized', message: 'JWT inválido ou ausente.' }, { status: 401 })
    }

    const { valueBRL } = await request.json()
    const amount = Number(valueBRL)
    if (!isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'InvalidAmount', message: 'valor BRL inválido' }, { status: 400 })
    }

    const pixId = `PIX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const payload = JSON.stringify({ key: 'merchant@payhub', amountBRL: amount.toFixed(2), txid: pixId })
    const qrCodeBase64 = base64FromText(payload)
    const expiresAt = Date.now() + 15 * 60 * 1000

    return NextResponse.json({ status: 'pending', pixId, qrCodeBase64, expiresAt })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST para criar QR PIX dinâmico.' })
}

