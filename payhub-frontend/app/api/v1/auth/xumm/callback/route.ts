import { NextRequest } from 'next/server'
import { proxyRequest } from '@/lib/utils'

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/api/identity/xumm/callback')
}

export async function GET() {
  return new Response(JSON.stringify({ message: 'Callback Xumm: envie via POST.' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
