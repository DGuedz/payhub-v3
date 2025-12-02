import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { logger } from '@/lib/logger'
import { finishEscrowSecure, executeSettlementWebhook } from '@/lib/XRPL_ESCROW_CLIENT'

const VTC_WEBHOOK_URL = 'https://vtc-copilot.com/api/payhub-settlement'

function validateHmac(bodyString: string, signature: string | null, timestamp: string | null): boolean {
  const secret = process.env.WEBHOOK_HMAC_SECRET || ''
  if (!secret || !signature || !timestamp) return false
  const data = `${timestamp}.${bodyString}`
  const digest = createHmac('sha256', secret).update(data).digest('hex')
  const a = Buffer.from(digest)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text()
    const sig = req.headers.get('x-payhub-signature')
    const ts = req.headers.get('x-payhub-timestamp')
    if (!validateHmac(raw, sig, ts)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = JSON.parse(raw)
    const { owner, offerSequence, vtcUserId, planId } = body || {}
    if (!owner || typeof offerSequence !== 'number') {
      return NextResponse.json({ ok: false, error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const finish = await finishEscrowSecure({ owner, offerSequence })
    if (!finish.ok) {
      return NextResponse.json({ ok: false, error: finish.error || 'Falha ao finalizar escrow' }, { status: 500 })
    }

    const payload = {
      escrowHash: finish.txHash,
      sequence: finish.sequence,
      vtcUserId,
      planId,
      timestamp: new Date().toISOString(),
      status: 'completed',
    }

    const webhookRes = await executeSettlementWebhook(VTC_WEBHOOK_URL, payload)
    if (!webhookRes.ok) {
      logger.warn('Falha ao notificar VTC', { status: webhookRes.status })
    }

    return NextResponse.json({ ok: true, txHash: finish.txHash, sequence: finish.sequence, notified: webhookRes.ok })
  } catch (error: any) {
    logger.error('Erro no webhook PAYHUB→VTC', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Webhook PAYHUB→VTC operacional' })
}