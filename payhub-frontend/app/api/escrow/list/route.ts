import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Dados simulados para ambiente de testnet
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner');
    
    logger.info(`[API /api/escrow/list] Buscando escrows para owner: ${owner}`);
    
    // Simular um pequeno delay de rede
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Dados simulados para testnet
    const mockEscrows = [
      {
        offerSequence: 123456,
        amount: "1500.00",
        currency: "RLUSD",
        txHash: "A1B2C3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
        status: "pending",
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        offerSequence: 123457,
        amount: "2750.50",
        currency: "RLUSD", 
        txHash: "FEDCBA0987654321FEDCBA0987654321FEDCBA0987654321FEDCBA0987654321",
        status: "completed",
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    
    // Filtrar por owner se especificado
    const filteredEscrows = owner 
      ? mockEscrows.filter(escrow => escrow.txHash?.includes(owner.slice(-8)))
      : mockEscrows;
    
    return NextResponse.json({ 
      escrows: filteredEscrows,
      total: filteredEscrows.length,
      message: "Dados simulados para ambiente de testnet"
    });
    
  } catch (error) {
    logger.error(`[API /api/escrow/list] Erro ao buscar escrows:`, error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', escrows: [] }, 
      { status: 500 }
    );
  }
}