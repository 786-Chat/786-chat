import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

export async function POST(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const body = await request.json();
    const { product_id, movement_type, qty, reference, user_id, user_name, batch_number, batch_id } = body;
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
    let batchAllocations: any[] = [];
    let batchNumber = batch_number || '';
    if (movement_type === 'STOCK IN') {
      const stockInDate = new Date().toISOString().slice(0, 10);
      const stockInTime = new Date().toISOString().slice(11, 16);
      if (!batchNumber) {
        const countResult = await query(`SELECT COUNT(*) as count FROM stock_batches WHERE product_id = $1`, [product_id]);
        const count = Number(countResult.rows[0]?.count || 0) + 1;
        batchNumber = `${product.sku}-${stockInDate.replace(/-/g, '')}-${String(count).padStart(3, '0')}`;
      }
      const batchResult = await query(
        `INSERT INTO stock_batches (batch_number, product_id, sku, product_name, qty_received, qty_remaining, unit, stock_in_date, stock_in_time, reference, supplier, best_before_date, use_by_date, expiry_date, status, created_by) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ACTIVE', $14) RETURNING *`,
        [batchNumber, product_id, product.sku, product.product_name, qtyNum, product.unit, stockInDate, stockInTime, reference || '', product.supplier || '', body.best_before_date || null, body.use_by_date || null, body.expiry_date || null, user_name]
      );
      if (batchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
      }
      batchAllocations = [{ batch_id: batchResult.rows[0].id, batch_number: batchNumber, qty: qtyNum }];
    } else {
      // Stock Out: determine batches to consume
      const rotationMethod = product.rotation_method || 'FIFO';
      let batches: any[] = [];
      if (rotationMethod === 'Manual') {
        if (!batch_id) {
          return NextResponse.json({ error: 'Manual rotation requires batch selection' }, { status: 400 });
        }
        const batchResult = await query('SELECT * FROM stock_batches WHERE id = $1 AND product_id = $2 AND status = $3', [batch_id, product_id, 'ACTIVE']);
        if (batchResult.rows.length === 0) {
          return NextResponse.json({ error: 'Batch not found or not active' }, { status: 404 });
        }
        const batch = batchResult.rows[0];
        if (Number(batch.qty_remaining) < qtyNum) {
          return NextResponse.json({ error: 'Not enough stock in selected batch' }, { status: 400 });
        }
        batches = [batch];
      } else {
        const orderBy = rotationMethod === 'FEFO'
          ? `ORDER BY COALESCE(use_by_date, expiry_date, '9999-12-31') ASC, stock_in_date ASC`
          : `ORDER BY stock_in_date ASC, stock_in_time ASC`;
        const batchResult = await query(
          `SELECT * FROM stock_batches WHERE product_id = $1 AND status = 'ACTIVE' AND qty_remaining > 0 ${orderBy}`,
          [product_id]
        );
        batches = batchResult.rows;
      }
      let remaining = qtyNum;
      const allocations: any[] = [];
      for (const batch of batches) {
        if (remaining <= 0) break;
        const available = Number(batch.qty_remaining);
        const consume = Math.min(available, remaining);
        const newRemaining = available - consume;
        const newStatus = newRemaining === 0 ? 'DEPLETED' : 'ACTIVE';
        await query(
          `UPDATE stock_batches SET qty_remaining = $1, status = $2 WHERE id = $3`,
          [newRemaining, newStatus, batch.id]
        );
        allocations.push({ batch_id: batch.id, batch_number: batch.batch_number, qty: consume });
        remaining -= consume;
      }
      if (remaining > 0) {
        return NextResponse.json({ error: 'Not enough stock in batches' }, { status: 400 });
      }
      batchAllocations = allocations;
      batchNumber = allocations.map((a) => a.batch_number).join(', ');
    }
    const movementResult = await query(
      `INSERT INTO stock_movements (product_id, sku, product_name, movement_type, qty_in, qty_out, previous_stock, new_stock, unit, reference, user_id, user_name, batch_number, batch_allocations) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
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
        batchNumber || null,
        JSON.stringify(batchAllocations),
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
