import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/ticketing';
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}