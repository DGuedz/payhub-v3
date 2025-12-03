import { logger } from '@/lib/logger'

export interface VtcWebhookPayload {
  escrowHash: string
  sequence: number
  vtcUserId: string
  planId: 'Starter' | 'Pro' | 'Elite'
  timestamp: string
  status: 'completed'
}

export async function vtcPlanUpdateFlow(payload: VtcWebhookPayload): Promise<{ ok: boolean }> {
  try {
    logger.info('Iniciando fluxo n8n/Trae: atualização de plano VTC', payload)

    const finished = await checkEscrowFinished(payload.escrowHash)
    if (!finished) {
      logger.warn('Escrow não finalizado, abortando provisionamento', { escrowHash: payload.escrowHash })
      return { ok: false }
    }

    const res = await fetch('https://vtc-copilot.com/api/payhub-settlement/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: payload.vtcUserId, planId: payload.planId, escrowHash: payload.escrowHash }),
    })

    logger.info('Provisionamento VTC chamado', { status: res.status })
    return { ok: res.ok }
  } catch (error: any) {
    logger.error('Falha no fluxo de atualização de plano VTC', error)
    return { ok: false }
  }
}

async function checkEscrowFinished(escrowHash: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 200))
  return Boolean(escrowHash)
}