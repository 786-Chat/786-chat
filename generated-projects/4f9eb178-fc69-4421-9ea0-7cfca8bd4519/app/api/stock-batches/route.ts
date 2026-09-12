import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';

export async function GET(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }
    const result = await query(
      'SELECT * FROM stock_batches WHERE product_id = $1 ORDER BY stock_in_date ASC, stock_in_time ASC',
      [Number(productId)]
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
