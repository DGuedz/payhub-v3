import { NextRequest } from 'next/server'
import { proxyRequest } from '@/lib/utils'

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/api/v1/merchant/yield/activate')
}

export async function GET() {
  return new Response(JSON.stringify({ message: 'Use POST para ativar yield automático.' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
