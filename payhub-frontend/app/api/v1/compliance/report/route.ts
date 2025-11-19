import { HubAiAgent } from '@/lib/hub-ai-agent';
import { logger } from '@/lib/logger';
import { convertToCSV } from '@/lib/utils';

/**
 * API endpoint to generate and download a compliance report in CSV format.
 * This demonstrates the RegTech capabilities of the HubAiAgent, providing auditable,
 * on-chain transaction data.
 */
export async function GET() {
  logger.info('Requisição para gerar relatório de compliance recebida...');

  try {
    const agent = new HubAiAgent();

    // Generate the raw compliance data
    const reportData = await agent.generateComplianceReport();

    // Convert the JSON data to CSV format
    const csv = convertToCSV(reportData);

    logger.info('Relatório de compliance gerado e convertido para CSV com sucesso.');

    // Set headers to instruct the browser to download the file
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename="compliance_report.csv"');

    // Return the CSV data as a downloadable file
    return new Response(csv, { headers });
  } catch (error) {
    logger.error('Falha ao gerar o relatório de compliance.', { error });

    // Return a standardized error response in JSON format
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Ocorreu um erro ao gerar o relatório de compliance.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}