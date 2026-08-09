import { NextRequest } from 'next/server';

export function requireTenant(request: NextRequest) {
  const companyId = request.headers.get('x-company-id');
  if (!companyId || companyId !== 'saffron') {
    throw new Error('Forbidden: missing or invalid company');
  }
  return companyId;
}
