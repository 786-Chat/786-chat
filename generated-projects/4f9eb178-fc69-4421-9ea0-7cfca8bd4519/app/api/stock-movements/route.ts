import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { stockMovementQuerySchema } from '@/lib/server/validation';
import { requireTenant } from '@/lib/server/tenant';

export async function GET(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const parsed = stockMovementQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { search, type, dateFrom, dateTo, productId, page = '1', pageSize = '50' } = parsed.data;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));
    const offset = (pageNum - 1) * pageSizeNum;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;
    if (search) {
      conditions.push(`(sku ILIKE $${paramIndex} OR product_name ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (type) {
      conditions.push(`movement_type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }
    if (dateFrom) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(dateFrom);
      paramIndex++;
    }
    if (dateTo) {
      conditions.push(`created_at < ($${paramIndex}::date + interval '1 day')`);
      values.push(dateTo);
      paramIndex++;
    }
    if (productId) {
      conditions.push(`product_id = $${paramIndex}`);
      values.push(Number(productId));
      paramIndex++;
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) as count FROM stock_movements ${whereClause}`, values);
    const total = Number(countResult.rows[0]?.count || 0);
    const totalPages = Math.ceil(total / pageSizeNum);
    const result = await query(
      `SELECT * FROM stock_movements ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, pageSizeNum, offset]
    );
    return NextResponse.json({ rows: result.rows, total, page: pageNum, pageSize: pageSizeNum, totalPages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
