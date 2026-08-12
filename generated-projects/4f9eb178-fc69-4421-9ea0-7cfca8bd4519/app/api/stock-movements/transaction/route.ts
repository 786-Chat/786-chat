import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

export async function POST(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const body = await request.json();
    const { product_id, movement_type, qty, reference, user_id, user_name } = body;
    if (!product_id || !movement_type || !qty || qty <= 0 || !user_id || !user_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['STOCK IN', 'STOCK OUT'].includes(movement_type)) {
      return NextResponse.json({ error: 'Invalid movement type' }, { status: 400 });
    }
    const productResult = await query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const product = productResult.rows[0];
    const previousStock = Number(product.stock_quantity);
    const qtyNum = Number(qty);
    let newStock;
    if (movement_type === 'STOCK IN') {
      newStock = previousStock + qtyNum;
    } else {
      if (qtyNum > previousStock) {
        return NextResponse.json({ error: 'Not enough stock available' }, { status: 400 });
      }
      newStock = previousStock - qtyNum;
    }
    const timestamp = new Date().toISOString();
    const updateField = movement_type === 'STOCK IN' ? 'last_stock_in_at' : 'last_stock_out_at';
    const updateResult = await query(
      `UPDATE products SET stock_quantity = $1, ${updateField} = $2 WHERE id = $3 RETURNING *`,
      [newStock, timestamp, product_id]
    );
    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
    const movementResult = await query(
      `INSERT INTO stock_movements (product_id, sku, product_name, movement_type, qty_in, qty_out, previous_stock, new_stock, unit, reference, user_id, user_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        product_id,
        product.sku,
        product.product_name,
        movement_type,
        movement_type === 'STOCK IN' ? qtyNum : null,
        movement_type === 'STOCK OUT' ? qtyNum : null,
        previousStock,
        newStock,
        product.unit,
        reference || '',
        user_id,
        user_name,
      ]
    );
    if (movementResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to record movement' }, { status: 500 });
    }
    await logAudit('saffron', movement_type === 'STOCK IN' ? 'stock_in' : 'stock_out', 'product', product_id);
    return NextResponse.json({ product: updateResult.rows[0], movement: movementResult.rows[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
