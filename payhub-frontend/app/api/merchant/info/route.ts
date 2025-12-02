import { NextResponse } from 'next/server';
import { NextRequest } from "next/server";
import { logger } from '@/lib/logger';

// Simulação de uma consulta a um banco de dados ou outra fonte de dados
const getMerchantInfo = async (merchantId: string) => {
  // Em um cenário real, você buscaria dados com base no merchantId
  // e na autenticação do usuário (ex: a partir do token JWT).
  logger.info(`Buscando informações para o merchant: ${merchantId}`);

  // Dados simulados para fins de demonstração
  return {
    merchantId: merchantId,
    balanceRLUSD: 15720.50, // Saldo em RLUSD
    yieldRate: "7.2% APY", // Taxa de rendimento atual
    lastUpdated: new Date().toISOString(),
  };
};

export async function GET(request: NextRequest) {
  // Em um projeto real, o ID do comerciante viria do token de autenticação
  // ou de um parâmetro seguro, não de um query param aberto.
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Merchant ID é obrigatório' }, { status: 400 });
  }

  try {
    // Adicionando um pequeno delay para simular a latência da rede
    await new Promise(resolve => setTimeout(resolve, 300));

    const merchantInfo = await getMerchantInfo(id);

    return NextResponse.json(merchantInfo);
  } catch (error) {
    logger.error(`[API /api/merchant/info] Erro ao buscar informações:`, error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}