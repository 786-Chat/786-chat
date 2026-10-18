import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';

export async function GET(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const result = await query('SELECT id, name FROM staff ORDER BY name');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
