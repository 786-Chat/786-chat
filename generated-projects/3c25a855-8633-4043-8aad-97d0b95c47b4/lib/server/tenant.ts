import { NextResponse } from 'next/server';

export function requireTenant(request: Request): string {
  const companyId = request.headers.get('x-company-id');
  if (!companyId) {
    throw new Error('Missing companyId');
  }
  return companyId;
}
