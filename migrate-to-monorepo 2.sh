#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DASH_DIR="$ROOT_DIR/payhub-dashboard"
mkdir -p "$DASH_DIR/src" "$DASH_DIR/public"
if [ ! -f "$DASH_DIR/tsconfig.json" ]; then
  cat > "$DASH_DIR/tsconfig.json" << 'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": false,
    "outDir": "dist"
  },
  "include": ["src"]
}
JSON
fi
if [ ! -f "$DASH_DIR/vite.config.ts" ]; then
  cat > "$DASH_DIR/vite.config.ts" << 'TS'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  plugins: [react()]
})
TS
fi
if [ ! -f "$DASH_DIR/index.html" ]; then
  cat > "$DASH_DIR/index.html" << 'HTML'
<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PAYHUB Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTML
fi
if [ ! -f "$DASH_DIR/src/main.tsx" ]; then
  cat > "$DASH_DIR/src/main.tsx" << 'TSX'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const el = document.getElementById('root') as HTMLElement
createRoot(el).render(<App />)
TSX
fi
if [ ! -f "$DASH_DIR/src/api.ts" ]; then
  cat > "$DASH_DIR/src/api.ts" << 'TS'
export async function callApi(path: string, method = 'GET', body?: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`/api${path.startsWith('/') ? path : `/${path}`}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error((json && (json.error || json.message)) || 'API error')
  return json
}
TS
fi
if [ ! -f "$DASH_DIR/src/App.tsx" ]; then
  cat > "$DASH_DIR/src/App.tsx" << 'TSX'
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
TSX
fi
cp -f "$ROOT_DIR/public"/*.html "$DASH_DIR/public" 2>/dev/null || true
echo "OK"
