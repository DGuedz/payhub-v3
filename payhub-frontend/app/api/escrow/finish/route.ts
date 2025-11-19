import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner, offerSequence } = body;
    
    logger.info(`[API /api/escrow/finish] Finalizando escrow: owner=${owner}, sequence=${offerSequence}`);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Retornar resposta simulada para testnet
    return NextResponse.json({
      ok: true,
      message: "Escrow finalizado com sucesso",
      owner: owner,
      offerSequence: offerSequence,
      txHash: `FIN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: "completed",
      timestamp: new Date().toISOString(),
      details: "Liquidação D+0 concluída - RLUSD disponível na tesouraria"
    });
    
  } catch (error) {
    logger.error(`[API /api/escrow/finish] Erro:`, error);
    return NextResponse.json(
      { ok: false, error: 'Erro ao finalizar escrow' },
      { status: 500 }
    );
  }
}