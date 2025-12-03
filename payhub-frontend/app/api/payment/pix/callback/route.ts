import { NextRequest, NextResponse } from 'next/server'

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

function getBaseUrlFromReq(req: NextRequest) {
  try {
    const u = new URL(req.url)
    return `${u.protocol}//${u.host}`
  } catch {
    return ''
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

    const { pixId, valueBRL } = await request.json()
    if (!pixId) return NextResponse.json({ error: 'Missing pixId' }, { status: 400 })
    const amountBRL = Number(valueBRL)
    if (!isFinite(amountBRL) || amountBRL <= 0) return NextResponse.json({ error: 'InvalidAmount' }, { status: 400 })

    const baseUrl = getBaseUrlFromReq(request)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const valueRLUSD = (amountBRL / 5.0).toFixed(2)

    const createRes = await fetch(`${baseUrl}/api/escrow-create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ value: valueRLUSD })
    })
    const createJson = await createRes.json().catch(() => null)
    if (!createRes.ok) {
      return NextResponse.json({ error: createJson?.error || 'ESCROW_CREATE_FAILED', step: 'create' }, { status: 500 })
    }

    const offerSequence = Number(createJson?.offerSequence)
    const owner = String(createJson?.owner || '')
    const createHash = String(createJson?.txHash || '')

    await new Promise((r) => setTimeout(r, 2000))

    const finishRes = await fetch(`${baseUrl}/api/escrow-finish`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ owner, offerSequence })
    })
    const finishJson = await finishRes.json().catch(() => null)
    if (!finishRes.ok) {
      return NextResponse.json({ error: finishJson?.error || 'ESCROW_FINISH_FAILED', step: 'finish', offerSequence, owner }, { status: 500 })
    }

    const finishHash = String(finishJson?.txHash || '')
    const sequence = Number(finishJson?.sequence)

    return NextResponse.json({ status: 'settled', pixId, createHash, offerSequence, owner, finishHash, sequence })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST para callback PIX (simulado).' })
}

