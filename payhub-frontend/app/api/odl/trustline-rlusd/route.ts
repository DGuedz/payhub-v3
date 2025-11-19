import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issuer } = body;
    
    logger.info(`[API /api/odl/trustline-rlusd] Criando trustline para issuer: ${issuer}`);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Retornar resposta simulada para testnet
    return NextResponse.json({
      ok: true,
      message: "Trustline configurada com sucesso",
      issuer: issuer,
      currency: "RLUSD",
      limit: "1000000",
      txHash: "TRUST1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`[API /api/odl/trustline-rlusd] Erro:`, error);
    return NextResponse.json(
      { ok: false, error: 'Erro ao configurar trustline' },
      { status: 500 }
    );
  }
}
