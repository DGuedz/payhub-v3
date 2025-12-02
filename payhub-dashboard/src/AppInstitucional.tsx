import React, { useEffect, useMemo, useState } from 'react'
import { callApi } from './api'

type Status = 'idle' | 'processing' | 'success' | 'error'

export function AppInstitucional() {
  const COLORS = useMemo(() => ({
    BG: '#001F3F',
    CARD: '#0A2A52',
    GREEN: '#00FF84',
    RED: '#FF3B30',
    BLUE: '#2979FF',
    TEXT: '#FFFFFF',
  }), [])

  const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('jwt_token') || '') : ''
  const [owner, setOwner] = useState('')
  const [offerSequence, setOfferSequence] = useState<string>('')
  const [merchantId, setMerchantId] = useState('merchant_demo')
  const [trustlineOk, setTrustlineOk] = useState<boolean | null>(null)

  const [statusLiquidar, setStatusLiquidar] = useState<Status>('idle')
  const [statusFinalizar, setStatusFinalizar] = useState<Status>('idle')
  const [statusYield, setStatusYield] = useState<Status>('idle')
  const [statusCompliance, setStatusCompliance] = useState<Status>('idle')

  const [lastTx, setLastTx] = useState<{ txHash?: string; sequence?: number; activationId?: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function run() {
      if (!token) return
      try {
        setTrustlineOk(null)
        const res = await callApi('/trustline-rlusd', 'POST', { limit: '1000' }, token)
        if (!mounted) return
        setTrustlineOk(Boolean(res && res.ok))
      } catch {
        if (!mounted) return
        setTrustlineOk(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [token])

  async function onLiquidarD0() {
    try {
      setError('')
      setStatusLiquidar('processing')
      const seq = Number(offerSequence)
      if (!owner || !Number.isFinite(seq)) throw new Error('Parâmetros inválidos')
      const res = await callApi('/escrow-finish', 'POST', { owner, offerSequence: seq }, token)
      setLastTx({ txHash: String(res?.txHash || ''), sequence: Number(res?.sequence || 0) })
      setStatusLiquidar('success')
    } catch (e: any) {
      setStatusLiquidar('error')
      setError(e?.message || 'Falha ao liquidar')
    }
  }

  async function onFinalizarEscrows() {
    try {
      setError('')
      setStatusFinalizar('processing')
      const sim = await callApi('/simulate/escrow-e2e', 'POST', { value: '100.00', merchantWallet: merchantId }, token)
      const art = sim?.artifacts || {}
      const o = String(art?.escrowFinish?.owner || art?.escrowCreate?.owner || '')
      const seq = Number(art?.escrowFinish?.offerSequence || art?.escrowCreate?.offerSequence || 0)
      if (!o || !Number.isFinite(seq)) throw new Error('Escrow inexistente')
      const res = await callApi('/escrow-finish', 'POST', { owner: o, offerSequence: seq }, token)
      setOwner(o)
      setOfferSequence(String(seq))
      setLastTx({ txHash: String(res?.txHash || ''), sequence: Number(res?.sequence || 0) })
      setStatusFinalizar('success')
    } catch (e: any) {
      setStatusFinalizar('error')
      setError(e?.message || 'Falha ao finalizar escrows')
    }
  }

  async function onAtivarYield() {
    try {
      setError('')
      setStatusYield('processing')
      const res = await callApi('/v1/merchant/yield/activate', 'POST', { merchantId }, token)
      setLastTx({ activationId: String(res?.activationId || '') })
      setStatusYield('success')
    } catch (e: any) {
      setStatusYield('error')
      setError(e?.message || 'Falha ao ativar yield')
    }
  }

  async function onRelatorioCompliance() {
    try {
      setError('')
      setStatusCompliance('processing')
      const res = await callApi('/v1/compliance/report', 'GET', undefined, token)
      setLastTx({ txHash: String((res && res.ok && res.content) ? 'CSV' : '') })
      setStatusCompliance('success')
    } catch (e: any) {
      setStatusCompliance('error')
      setError(e?.message || 'Falha ao gerar relatório')
    }
  }

  function statusBadge(s: Status) {
    const bg = s === 'idle' ? 'rgba(255,255,255,0.1)' : s === 'processing' ? COLORS.BLUE : s === 'success' ? COLORS.GREEN : COLORS.RED
    return <span style={{ backgroundColor: bg, color: COLORS.TEXT, padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>{s}</span>
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: COLORS.BG, color: COLORS.TEXT }}>
      <section style={{ padding: '24px 16px', display: 'grid', justifyItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 960 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>PAYHUB Soft‑POS Institucional</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: token ? COLORS.GREEN : COLORS.RED }}></div>
              <span style={{ fontSize: 12 }}>{token ? 'Segurança Ativa — Bearer JWT' : 'Sem JWT'}</span>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.9 }}>Paleta: Azul Marinho · Verde Neon</div>

          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            <div style={{ backgroundColor: COLORS.CARD, borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Saldo Atual (RLUSD)</div>
                  <div style={{ fontSize: 32, fontWeight: 300 }}>12,500.00</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>APY: 6.2%</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Trustline</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: trustlineOk ? COLORS.GREEN : trustlineOk === false ? COLORS.RED : COLORS.BLUE }}></div>
                    <span style={{ fontSize: 12 }}>{trustlineOk === null ? 'verificando' : trustlineOk ? 'ok' : 'falha'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: COLORS.CARD, borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>LIQUIDAR D+0</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="owner" style={{ padding: 10, borderRadius: 8, border: '1px solid #2a355f', background: 'transparent', color: COLORS.TEXT }} />
                <input value={offerSequence} onChange={(e) => setOfferSequence(e.target.value)} placeholder="offerSequence" style={{ padding: 10, borderRadius: 8, border: '1px solid #2a355f', background: 'transparent', color: COLORS.TEXT }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={onLiquidarD0} disabled={statusLiquidar === 'processing'} style={{ backgroundColor: COLORS.GREEN, color: COLORS.BG, padding: '12px 14px', borderRadius: 10, fontWeight: 700 }}>POST /api/escrow-finish</button>
                  {statusBadge(statusLiquidar)}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: COLORS.CARD, borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>FINALIZAR ESCROWS</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="merchantId" style={{ padding: 10, borderRadius: 8, border: '1px solid #2a355f', background: 'transparent', color: COLORS.TEXT }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={onFinalizarEscrows} disabled={statusFinalizar === 'processing'} style={{ backgroundColor: COLORS.GREEN, color: COLORS.BG, padding: '12px 14px', borderRadius: 10, fontWeight: 700 }}>POST /api/escrow-finish</button>
                  {statusBadge(statusFinalizar)}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: COLORS.CARD, borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>ATIVAR YIELD AUTOMÁTICO</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={onAtivarYield} disabled={statusYield === 'processing'} style={{ backgroundColor: COLORS.GREEN, color: COLORS.BG, padding: '12px 14px', borderRadius: 10, fontWeight: 700 }}>POST /api/v1/merchant/yield/activate</button>
                {statusBadge(statusYield)}
              </div>
            </div>

            <div style={{ backgroundColor: COLORS.CARD, borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>RELATÓRIO COMPLIANCE</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={onRelatorioCompliance} disabled={statusCompliance === 'processing'} style={{ backgroundColor: COLORS.GREEN, color: COLORS.BG, padding: '12px 14px', borderRadius: 10, fontWeight: 700 }}>GET /api/v1/compliance/report</button>
                {statusBadge(statusCompliance)}
              </div>
            </div>

            {lastTx && (
              <div style={{ backgroundColor: COLORS.CARD, borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Último resultado</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>txHash: {lastTx.txHash || ''}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>sequence: {typeof lastTx.sequence === 'number' ? lastTx.sequence : ''}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>activationId: {lastTx.activationId || ''}</div>
              </div>
            )}

            {error && (
              <div style={{ color: COLORS.RED }}>{error}</div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

