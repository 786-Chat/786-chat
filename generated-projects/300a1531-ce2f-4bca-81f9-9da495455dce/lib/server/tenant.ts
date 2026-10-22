import { NextRequest } from 'next/server';

export function requireTenant(req: NextRequest) {
  const companyId = req.headers.get('x-company-id');
  if (!companyId) {
    throw new Error('Missing companyId');
  }
  return companyId;
}
