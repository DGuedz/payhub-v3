import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/utils';

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/api/trustline-rlusd');
}
