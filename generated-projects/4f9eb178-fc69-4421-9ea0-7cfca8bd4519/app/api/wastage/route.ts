import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

export async function POST(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const body = await request.json();
    const { product_id, qty, reason, other_reason, batch_id, staff_pin, reference } = body;

    if (!product_id || !qty || qty <= 0 || !reason || !staff_pin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate staff PIN
    const staffResult = await query('SELECT id, name FROM staff WHERE pin = $1', [staff_pin]);
    if (staffResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid staff PIN' }, { status: 400 });
    }
    const staff = staffResult.rows[0];

    // Get product
    const productResult = await query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const product = productResult.rows[0];

    const qtyNum = Number(qty);
    if (qtyNum > Number(product.stock_quantity)) {
      return NextResponse.json({ error: 'Not enough stock available' }, { status: 400 });
    }

    // Determine batch allocation
    let batchAllocations: any[] = [];
    let batchNumber = '';
    const rotationMethod = product.rotation_method || 'FIFO';

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
      batchAllocations = [{ batch_id: batch.id, batch_number: batch.batch_number, qty: qtyNum }];
      batchNumber = batch.batch_number;
    } else {
      const orderBy = rotationMethod === 'FEFO'
        ? `ORDER BY COALESCE(use_by_date, expiry_date, '9999-12-31') ASC, stock_in_date ASC`
        : `ORDER BY stock_in_date ASC, stock_in_time ASC`;
      const batchResult = await query(
        `SELECT * FROM stock_batches WHERE product_id = $1 AND status = 'ACTIVE' AND qty_remaining > 0 ${orderBy}`,
        [product_id]
      );
      let remaining = qtyNum;
      const allocations: any[] = [];
      for (const batch of batchResult.rows) {
        if (remaining <= 0) break;
        const available = Number(batch.qty_remaining);
        const consume = Math.min(available, remaining);
        allocations.push({ batch_id: batch.id, batch_number: batch.batch_number, qty: consume });
        remaining -= consume;
      }
      if (remaining > 0) {
        return NextResponse.json({ error: 'Not enough stock in batches' }, { status: 400 });
      }
      batchAllocations = allocations;
      batchNumber = allocations.map((a) => a.batch_number).join(', ');
    }

    // Calculate loss
    const costPrice = Number(product.cost_price);
    const totalLoss = qtyNum * costPrice;
    const previousStock = Number(product.stock_quantity);
    const newStock = previousStock - qtyNum;

    // Transaction
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Update product stock
      await client.query('UPDATE products SET stock_quantity = $1, last_stock_out_at = NOW() WHERE id = $2', [newStock, product_id]);

      // Update batches
      for (const alloc of batchAllocations) {
        const batchResult = await client.query('SELECT qty_remaining FROM stock_batches WHERE id = $1', [alloc.batch_id]);
        const currentRemaining = Number(batchResult.rows[0].qty_remaining);
        const newRemaining = currentRemaining - alloc.qty;
        const newStatus = newRemaining === 0 ? 'DEPLETED' : 'ACTIVE';
        await client.query('UPDATE stock_batches SET qty_remaining = $1, status = $2 WHERE id = $3', [newRemaining, newStatus, alloc.batch_id]);
      }

      // Insert wastage record
      const wastageResult = await client.query(
        `INSERT INTO wastage (product_id, product_name, sku, batch_id, batch_number, qty, unit, cost_price, total_loss, reason, other_reason, reference, staff_user_id, staff_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [product_id, product.product_name, product.sku, batchAllocations[0]?.batch_id || null, batchNumber, qtyNum, product.unit, costPrice, totalLoss, reason, other_reason || null, reference || '', staff.id, staff.name]
      );

      // Insert stock movement
      await client.query(
        `INSERT INTO stock_movements (product_id, sku, product_name, movement_type, qty_in, qty_out, previous_stock, new_stock, unit, reference, user_id, user_name, batch_number, batch_allocations) VALUES ($1,$2,$3,'WASTAGE',NULL,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [product_id, product.sku, product.product_name, qtyNum, previousStock, newStock, product.unit, reference || reason, staff.id, staff.name, batchNumber, JSON.stringify(batchAllocations)]
      );

      await client.query('COMMIT');
      await logAudit('saffron', 'wastage', 'product', product_id);
      return NextResponse.json({ wastage: wastageResult.rows[0], product: { ...product, stock_quantity: newStock } }, { status: 201 });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to get a client for transactions
import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from '@/lib/server/env';

let pool: any = null;
function getClient() {
  if (!pool) {
    pool = neon(getDatabaseUrl(), { arrayMode: false, fullResults: false });
  }
  return pool;
}
