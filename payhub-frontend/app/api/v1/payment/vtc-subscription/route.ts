import { NextResponse, NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { createVtcSubscriptionEscrow } from '@/lib/XRPL_ESCROW_CLIENT'

const VTC_PLANS = {
  Starter: 0.0,
  Pro: 49.0,
  Elite: 149.0,
}

const VTC_WEBHOOK_URL = 'https://vtc-copilot.com/api/payhub-settlement'

function getJwtSystem() {
  try {
    // Import relativo para o backend de segurança
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../../../../../src/backend/security/mfa-jwt-system')
    return new mod.MFAJWTSystem()
  } catch (err) {
    logger.warn('MFAJWTSystem indisponível. Verifique JWT_SECRET nas ENVs.')
    return null
  }
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
    const jwtSystem = getJwtSystem()
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.split(' ')[1]
    const okJose = await verifyJwtJose(token)
    const okMfa = jwtSystem && token ? Boolean(jwtSystem.validateToken(token)) : false
    if (!okJose && !okMfa) {
      return NextResponse.json({ error: '401 Unauthorized', message: 'JWT inválido ou ausente.' }, { status: 401 })
    }

    const { planId, paymentMethod, vtcUserId } = await request.json()

    const amount = VTC_PLANS[planId as keyof typeof VTC_PLANS]
    if (amount === undefined || amount <= 0) {
      return NextResponse.json({ error: 'InvalidPlan', message: 'Plano inválido ou preço zero.' }, { status: 400 })
    }

    const currency = 'RLUSD'
    const issuer = process.env.RLUSD_ISSUER_ADDRESS || 'rRLUSDIssuerSimulated'
    const destination = process.env.TREASURY_VAULT_ADDRESS || 'rTreasuryVaultSimulated'

    const escrow = await createVtcSubscriptionEscrow({
      amount: amount.toFixed(2),
      currency,
      issuer,
      destination,
      condition: `VTC-${vtcUserId}-${planId}`,
    })

    let paymentInstruction = ''
    let paymentDetails: any = {}

    switch (paymentMethod) {
      case 'PIX':
        paymentInstruction = `Pagar R$ ${(amount * 5.0).toFixed(2)} via PIX.`
        paymentDetails = { qrCodeBase64: 'base64_pix_qr_simulado', expiration: Date.now() + 3600000 }
        break
      case 'Card':
        paymentInstruction = 'Redirecionar para URL de Checkout Seguro.'
        paymentDetails = { redirectUrl: `https://card-gateway.com/checkout/${escrow.txHash}` }
        break
      case 'Crypto':
        paymentInstruction = `Pagar ${amount.toFixed(2)} ${currency} para o emissor.`
        paymentDetails = { address: issuer, memo: vtcUserId }
        break
      default:
        paymentInstruction = 'Método de pagamento não suportado.'
        paymentDetails = {}
    }

    logger.info('Payload de pagamento VTC gerado', { planId, paymentMethod, escrowHash: escrow.txHash })

    return NextResponse.json({
      status: 'pending_payment',
      plan: planId,
      amount: amount.toFixed(2),
      currency: 'USD',
      escrowHash: escrow.txHash,
      escrowSequence: escrow.sequence,
      owner: escrow.owner,
      paymentMethod,
      paymentInstruction,
      paymentDetails,
      webhookUrl: VTC_WEBHOOK_URL,
    })
  } catch (error: any) {
    logger.error('Erro no endpoint VTC subscription', error)
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'VTC Subscription Gateway operacional. Use POST.' })
}