import { NextResponse } from 'next/server';

export function requireTenant(request: Request) {
  const companyId = request.headers.get('x-company-id');
  if (!companyId || companyId !== 'saffron') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}