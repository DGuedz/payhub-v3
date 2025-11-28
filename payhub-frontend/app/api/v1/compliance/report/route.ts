import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/utils';

export async function GET(req: NextRequest) {
  return proxyRequest(req, '/api/v1/compliance/report');
}
