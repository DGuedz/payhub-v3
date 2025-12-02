import { NextRequest } from 'next/server'
import { proxyRequest } from '@/lib/utils'

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/api/simulate/escrow-e2e')
}

export async function GET() {
  return new Response(JSON.stringify({ message: 'Use POST para simular fluxo Escrow E2E.' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
