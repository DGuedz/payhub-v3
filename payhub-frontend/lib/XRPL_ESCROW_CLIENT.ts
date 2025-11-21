import { logger } from '@/lib/logger'

interface CreateEscrowParams {
  amount: string
  currency: string
  issuer: string
  destination: string
  condition: string
}

interface CreateEscrowResult {
  status: 'created'
  txHash: string
  sequence: number
  owner: string
}

interface FinishEscrowParams {
  owner: string
  offerSequence: number
}

interface FinishEscrowResult {
  ok: boolean
  txHash?: string
  sequence?: number
  error?: string
}

export async function createVtcSubscriptionEscrow(params: CreateEscrowParams): Promise<CreateEscrowResult> {
  const owner = process.env.TREASURY_VAULT_ADDRESS || 'rTreasuryVaultSimulated'
  try {
    logger.info('Iniciando EscrowCreate RLUSD (simulado)', {
      amount: params.amount,
      currency: params.currency,
      issuer: params.issuer,
      destination: params.destination,
      condition: params.condition,
    })

    await new Promise((r) => setTimeout(r, 500))

    const sequence = Math.floor(Date.now() / 1000)
    const txHash = `ESC${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    logger.info('EscrowCreate concluído (mock)', { txHash, sequence, owner })
    return { status: 'created', txHash, sequence, owner }
  } catch (error: any) {
    logger.error('Falha ao criar escrow (mock)', error)
    throw new Error('Erro ao iniciar escrow RLUSD')
  }
}

export async function finishEscrowSecure(params: FinishEscrowParams): Promise<FinishEscrowResult> {
  try {
    const backend = await import('../../src/backend/lib/xrpl-client')
    const res = await backend.finishEscrow(params.owner, params.offerSequence)
    if (!res.ok) {
      logger.warn('EscrowFinish retornou erro do backend', res)
    } else {
      logger.info('EscrowFinish concluído', { txHash: res.txHash, sequence: res.sequence })
    }
    return res
  } catch (error: any) {
    logger.error('Falha ao finalizar escrow (backend)', error)
    return { ok: false, error: error?.message || 'Erro ao finalizar escrow' }
  }
}

export async function executeSettlementWebhook(webhookUrl: string, payload: Record<string, any>): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    logger.info('Webhook enviado ao VTC', { webhookUrl, status: res.status })
    return { ok: res.ok, status: res.status }
  } catch (error: any) {
    logger.error('Falha ao notificar VTC via webhook', error)
    return { ok: false, status: 0 }
  }
}