import React, { useState } from 'react'
import { callApi } from './api'

type Status = 'idle' | 'processing' | 'success' | 'error'

export function App() {
  const [pixAmountBRL, setPixAmountBRL] = useState<string>('100.00')
  const [pixId, setPixId] = useState<string>('')
  const [qrCodeBase64, setQrCodeBase64] = useState<string>('')
  const [pixStatus, setPixStatus] = useState<Status>('idle')
  const [settleStatus, setSettleStatus] = useState<Status>('idle')
  const [createHash, setCreateHash] = useState<string>('')
  const [offerSequence, setOfferSequence] = useState<number | null>(null)
  const [owner, setOwner] = useState<string>('')
  const [finishHash, setFinishHash] = useState<string>('')
  const [sequence, setSequence] = useState<number | null>(null)
  const [error, setError] = useState<string>('')

  const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('jwt_token') || '') : ''

  async function onPixGenerate() {
    try {
      setError('')
      setPixStatus('processing')
      const data = await callApi('/payment/pix', 'POST', { valueBRL: pixAmountBRL }, token)
      setPixId(String(data?.pixId || ''))
      setQrCodeBase64(String(data?.qrCodeBase64 || ''))
      setPixStatus('success')
    } catch (e: any) {
      setPixStatus('error')
      setError(e?.message || 'Falha ao gerar QR PIX')
    }
  }

  async function onPixSimulateCallback() {
    try {
      setError('')
      setSettleStatus('processing')
      const val = Number(pixAmountBRL)
      const data = await callApi('/payment/pix/callback', 'POST', { pixId, valueBRL: val }, token)
      setCreateHash(String(data?.createHash || ''))
      setOfferSequence(Number(data?.offerSequence))
      setOwner(String(data?.owner || ''))
      setFinishHash(String(data?.finishHash || ''))
      setSequence(Number(data?.sequence))
      setSettleStatus('success')
    } catch (e: any) {
      setSettleStatus('error')
      setError(e?.message || 'Falha ao liquidar')
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto' }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>PAYHUB Dashboard</div>
      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        <div style={{ border: '1px solid #2a355f', borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700 }}>PIX QR dinâmico</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={pixAmountBRL} onChange={(e) => setPixAmountBRL(e.target.value)} placeholder="Valor BRL" style={{ padding: 8, borderRadius: 8, border: '1px solid #2a355f' }} />
            <button onClick={onPixGenerate} disabled={pixStatus === 'processing'} style={{ padding: '8px 12px', borderRadius: 8 }}>Gerar QR</button>
            <span>{pixStatus}</span>
          </div>
          {qrCodeBase64 && (
            <div style={{ marginTop: 8 }}>
              <div>PIX ID: {pixId}</div>
              <div>QR Base64: {qrCodeBase64.slice(0, 32)}...</div>
            </div>
          )}
        </div>
        <div style={{ border: '1px solid #2a355f', borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700 }}>Callback PIX → EscrowCreate → EscrowFinish</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={onPixSimulateCallback} disabled={!pixId || settleStatus === 'processing'} style={{ padding: '8px 12px', borderRadius: 8 }}>Simular Callback</button>
            <span>{settleStatus}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div>offerSequence: {offerSequence ?? ''}</div>
            <div>owner: {owner}</div>
            <div>createHash: {createHash}</div>
            <div>finishHash: {finishHash}</div>
            <div>sequence: {sequence ?? ''}</div>
          </div>
        </div>
        {error && <div style={{ color: '#ff6b6b' }}>{error}</div>}
      </div>
    </div>
  )
}
