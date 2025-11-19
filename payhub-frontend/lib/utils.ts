import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Converte um array de objetos para uma string no formato CSV.
 * @param data O array de objetos a ser convertido.
 * @returns Uma string formatada como CSV.
 */
export function convertToCSV(data: any[]) {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // Linha de cabeçalho
    ...data.map(row =>
      headers.map(fieldName => {
        const value = row[fieldName];
        // Lida com valores nulos e escapa aspas e vírgulas
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        // Se o valor contém vírgula, aspas ou quebra de linha, coloca entre aspas duplas
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""' )}"`;
        }
        return stringValue;
      }).join(',')
    )
  ];

  return csvRows.join('\r\n');
}

/**
 * Encaminha uma requisição para o backend principal (API Gateway).
 * Lida com logging, erros e propagação de autenticação.
 * @param req A requisição original do Next.js.
 * @param endpoint O caminho do endpoint no backend principal.
 * @returns Uma resposta do Next.js.
 */
export async function proxyRequest(req: NextRequest, endpoint: string) {
  const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const body = req.method === 'POST' || req.method === 'PUT' ? await req.json().catch(() => ({})) : undefined;
    const auth = req.headers.get('authorization') || '';

    logger.info(`Proxying request: ${req.method} ${url}`, { body: body ? Object.keys(body) : 'no body' });

    const res = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      logger.error(`Proxy request failed for ${url}`, { status: res.status, error: data?.error || res.statusText });
      return NextResponse.json({ ok: false, error: data?.error || res.statusText }, { status: res.status });
    }

    return NextResponse.json(data);

  } catch (err) {
    logger.error(`Fatal error in proxyRequest for ${url}`, err);
    return NextResponse.json({ ok: false, error: 'Erro interno do proxy.' }, { status: 500 });
  }
}