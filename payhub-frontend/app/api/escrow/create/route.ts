import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, method } = body;
    
    logger.info(`[API /api/escrow/create] Criando escrow: ${JSON.stringify({ amount, method })}`);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Gerar dados simulados para testnet
    const offerSequence = Math.floor(100000 + Math.random() * 900000);
    const txHash = `ESC${Date.now()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    return NextResponse.json({
      ok: true,
      message: "Escrow criado com sucesso",
      offerSequence: offerSequence,
      txHash: txHash,
      amount: amount,
      status: "created",
      timestamp: new Date().toISOString(),
      details: `Pagamento via ${method} processado - Liquidação D+0 simulada`
    });
    
  } catch (error) {
    logger.error(`[API /api/escrow/create] Erro:`, error);
    return NextResponse.json(
      { ok: false, error: 'Erro ao criar escrow' },
      { status: 500 }
    );
  }
}
