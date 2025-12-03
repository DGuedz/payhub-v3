import { NextRequest } from 'next/server'
import { proxyRequest } from '@/lib/utils'

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/api/identity/xumm/start')
}

export async function GET() {
  return new Response(JSON.stringify({ message: 'Use POST para iniciar OAuth Xumm.' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
