CREATE TABLE IF NOT EXISTS wastage (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  batch_id INTEGER REFERENCES stock_batches(id),
  batch_number TEXT,
  qty NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,
  cost_price NUMERIC(10,2) NOT NULL,
  total_loss NUMERIC(12,2) NOT NULL,
  reason TEXT NOT NULL,
  other_reason TEXT,
  reference TEXT DEFAULT '',
  staff_user_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wastage_product_id ON wastage(product_id);
CREATE INDEX IF NOT EXISTS idx_wastage_created_at ON wastage(created_at);

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL
);

INSERT INTO staff (name, pin) VALUES ('Mujeeb', '1234') ON CONFLICT DO NOTHING;
