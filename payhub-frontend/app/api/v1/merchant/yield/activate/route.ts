import { NextResponse } from 'next/server';
import { HubAiAgent } from '@/lib/hub-ai-agent';
import { logger } from '@/lib/logger';

/**
 * API endpoint to activate the auto-yield feature for a merchant.
 * This endpoint simulates turning on the active treasury function, where the
 * HubAiAgent orchestrates moving surplus funds to yield-generating protocols.
 */
export async function POST() {
  logger.info('Recebida requisição para ativar o rendimento automático...');

  try {
    // Instantiate the AI agent that encapsulates the business logic
    const agent = new HubAiAgent();

    // Trigger the auto-yield activation process
    const result = await agent.activateAutoYield();

    logger.info('Rendimento automático ativado com sucesso.', { result });

    // Return a success response
    return NextResponse.json({
      success: true,
      message: 'Motor de Rendimento Ativo (Yield Engine) ativado com sucesso.',
      data: result,
    });
  } catch (error) {
    logger.error('Falha ao ativar o motor de rendimento.', { error });

    // Return a standardized error response
    return NextResponse.json(
      {
        success: false,
        message: 'Ocorreu um erro ao processar a ativação do rendimento.',
      },
      { status: 500 }
    );
  }
}