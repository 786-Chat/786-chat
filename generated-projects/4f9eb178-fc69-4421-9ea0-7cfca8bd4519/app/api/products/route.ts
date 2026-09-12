import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { productSchema } from '@/lib/server/validation';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

export async function GET(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const result = await query('SELECT * FROM products ORDER BY created_at DESC');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { product_name, sku, category, cost_price, selling_price, vat_percent, stock_quantity, minimum_stock, unit, supplier, active, rotation_method, storage_type, min_temperature, max_temperature } = parsed.data;
    const result = await query(
      `INSERT INTO products (product_name, sku, category, cost_price, selling_price, vat_percent, stock_quantity, minimum_stock, unit, supplier, active, rotation_method, storage_type, min_temperature, max_temperature) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [product_name, sku, category, cost_price, selling_price, vat_percent, stock_quantity, minimum_stock, unit, supplier, active, rotation_method, storage_type, min_temperature, max_temperature]
    );
    const product = result.rows[0];
    await logAudit('saffron', 'create', 'product', product.id);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
