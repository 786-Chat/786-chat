import 'server-only';
import { getSql } from './db';

let schemaPromise: Promise<void> | null = null;

export function ensureProductSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          sku TEXT NOT NULL,
          price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
          stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(user_id, sku)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id UUID REFERENCES products(id) ON DELETE SET NULL,
          product_name TEXT NOT NULL,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
          line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)`;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}
