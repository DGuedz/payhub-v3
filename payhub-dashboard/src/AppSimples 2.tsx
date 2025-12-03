import React, { useMemo, useState } from 'react'
import { callApi } from './api'

type Status = 'idle' | 'processing' | 'success' | 'error'

export function AppSimples() {
  const COLORS = useMemo(() => ({ BG: '#001F3F', CARD: '#0A2A52', GREEN: '#00FF84', RED: '#FF3B30', TEXT: '#FFFFFF' }), [])
  const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('jwt_token') || '') : ''
  const [owner, setOwner] = useState('')
  const [offerSequence, setOfferSequence] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')

  async function liquidar() {
    try {
      setMsg('')
      setStatus('processing')
      const seq = Number(offerSequence)
      if (!owner || !Number.isFinite(seq)) throw new Error('Parâmetros inválidos')
      const res = await callApi('/escrow-finish', 'POST', { owner, offerSequence: seq }, token)
      setMsg(String(res?.txHash || ''))
      setStatus('success')
    } catch (e: any) {
      setStatus('error')
      setMsg(e?.message || 'Falha ao liquidar')
    }
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: COLORS.BG, color: COLORS.TEXT }}>
      <section style={{ padding: 16, display: 'grid', justifyItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Soft‑POS (Simples)</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: token ? COLORS.GREEN : COLORS.RED }}></div>
            <span style={{ fontSize: 12 }}>{token ? 'JWT ativo' : 'Sem JWT'}</span>
          </div>
          <div style={{ backgroundColor: COLORS.CARD, borderRadius: 12, padding: 16, marginTop: 16 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="owner" style={{ padding: 10, borderRadius: 8, border: '1px solid #2a355f', background: 'transparent', color: COLORS.TEXT }} />
              <input value={offerSequence} onChange={(e) => setOfferSequence(e.target.value)} placeholder="offerSequence" style={{ padding: 10, borderRadius: 8, border: '1px solid #2a355f', background: 'transparent', color: COLORS.TEXT }} />
              <button onClick={liquidar} disabled={status === 'processing'} style={{ backgroundColor: COLORS.GREEN, color: COLORS.BG, padding: '12px 14px', borderRadius: 10, fontWeight: 700 }}>POST /api/escrow-finish</button>
              <div style={{ fontSize: 12, opacity: 0.9 }}>{status}</div>
              {msg && <div style={{ fontSize: 12 }}>{msg}</div>}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

