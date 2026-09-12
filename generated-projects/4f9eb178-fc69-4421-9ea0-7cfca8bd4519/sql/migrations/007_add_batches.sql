CREATE TABLE IF NOT EXISTS stock_batches (
  id SERIAL PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  qty_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  qty_remaining NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'Each',
  stock_in_date DATE NOT NULL,
  stock_in_time TIME NOT NULL,
  reference TEXT DEFAULT '',
  supplier TEXT DEFAULT '',
  best_before_date DATE,
  use_by_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DEPLETED','EXPIRED')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_batches_product_id ON stock_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_status ON stock_batches(status);
CREATE INDEX IF NOT EXISTS idx_stock_batches_expiry ON stock_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_batches_use_by ON stock_batches(use_by_date);

ALTER TABLE products ADD COLUMN IF NOT EXISTS rotation_method TEXT NOT NULL DEFAULT 'FIFO' CHECK (rotation_method IN ('FIFO','FEFO','Manual'));

ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS batch_number TEXT;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS batch_allocations JSONB DEFAULT '[]'::jsonb;
