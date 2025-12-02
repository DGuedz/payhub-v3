import { NextResponse } from 'next/server';

export async function GET() {
  // Para ambiente de testnet, sempre retornar saudável
  return NextResponse.json({
    ok: true,
    status: 'healthy',
    environment: 'testnet',
    timestamp: new Date().toISOString(),
    message: 'Serviço funcionando em modo de simulação testnet'
  });
}
